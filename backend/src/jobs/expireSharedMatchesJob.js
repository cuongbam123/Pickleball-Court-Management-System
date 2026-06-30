const cron = require("node-cron");
const mongoose = require("mongoose");
const SharedMatch = require("../models/sharedMatch");
const SharedTicket = require("../models/sharedTicket");
const Booking = require("../models/bookings");
const User = require("../models/users");
const { emitBookingChange } = require("../config/socket");

let isRunning = false;

const cancelOverdueRecruitingSharedMatches = async () => {
  const now = new Date();

  const overdueBookings = await Booking.find({
    booking_type: "shared_match",
    is_deleted: false,
    status: { $ne: "cancelled" },
    start_time: { $lte: now },
  }).select("_id");

  const bookingIds = overdueBookings.map((booking) => booking._id);
  if (bookingIds.length === 0) return 0;

  const overdueMatches = await SharedMatch.find({
    booking_id: { $in: bookingIds },
    is_deleted: false,
    status: "recruiting",
  }).select("_id");

  let cancelledCount = 0;

  for (const match of overdueMatches) {
    const session = await mongoose.startSession();
    let cancelledBooking = null;

    try {
      const wasCancelled = await session.withTransaction(async () => {
        const sharedMatch = await SharedMatch.findOne({
          _id: match._id,
          is_deleted: false,
          status: "recruiting",
        }).session(session);

        if (!sharedMatch) return false;

        const booking = await Booking.findOne({
          _id: sharedMatch.booking_id,
          booking_type: "shared_match",
          is_deleted: false,
          status: { $ne: "cancelled" },
          start_time: { $lte: now },
        }).session(session);

        if (!booking) return false;

        const paidTicketsCount = await SharedTicket.countDocuments({
          shared_match_id: sharedMatch._id,
          payment_status: "paid",
          is_deleted: false,
        }).session(session);

        if (paidTicketsCount >= sharedMatch.max_slots) {
          sharedMatch.status = "locked";
          sharedMatch.booked_slots = Math.max(
            sharedMatch.booked_slots,
            paidTicketsCount,
          );
          await sharedMatch.save({ session });
          return false;
        }

        cancelledBooking = await Booking.findOneAndUpdate(
          { _id: booking._id, is_deleted: false },
          {
            $set: {
              status: "cancelled",
              cancelled_by: "system",
              cancel_at: now,
              expires_at: null,
            },
          },
          {
            new: true,
            session,
          },
        );

        const paidTickets = await SharedTicket.find({
          shared_match_id: sharedMatch._id,
          payment_status: "paid",
          is_deleted: false,
        })
          .select("user_id paid_amount ticket_price")
          .session(session);

        const refundOps = paidTickets
          .map((ticket) => {
            const refundAmount =
              Number(ticket.paid_amount) > 0
                ? Number(ticket.paid_amount)
                : Number(ticket.ticket_price);

            return {
              updateOne: {
                filter: { _id: ticket.user_id, is_deleted: false },
                update: { $inc: { credit: refundAmount } },
              },
            };
          })
          .filter((operation) => operation.updateOne.update.$inc.credit > 0);

        if (refundOps.length > 0) {
          await User.bulkWrite(refundOps, { session, ordered: false });
        }

        await SharedTicket.updateMany(
          {
            shared_match_id: sharedMatch._id,
            payment_status: { $in: ["pending", "paid"] },
            is_deleted: false,
          },
          {
            $set: {
              payment_status: "cancelled",
              expires_at: null,
            },
          },
          { session },
        );

        sharedMatch.status = "cancelled";
        await sharedMatch.save({ session });

        return true;
      });

      if (wasCancelled) {
        cancelledCount += 1;
        if (cancelledBooking) {
          emitBookingChange("cancel", cancelledBooking);
        }
      }
    } finally {
      session.endSession();
    }
  }

  return cancelledCount;
};

const expireSharedMatchesJob = () => {
  cron.schedule("* * * * *", async () => {
    if (isRunning) return;

    isRunning = true;

    try {
      const cancelledCount = await cancelOverdueRecruitingSharedMatches();

      if (cancelledCount > 0) {
        console.log(
          `[expireSharedMatchesJob] Đã tự động hủy ${cancelledCount} ca ghép quá giờ nhưng chưa đủ người.`,
        );
      }
    } catch (error) {
      console.error("Lỗi khi chạy cron job expireSharedMatchesJob:", error);
    } finally {
      isRunning = false;
    }
  });
};

module.exports = expireSharedMatchesJob;
module.exports.cancelOverdueRecruitingSharedMatches =
  cancelOverdueRecruitingSharedMatches;
