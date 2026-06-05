const cron = require("node-cron");
const Booking = require("../models/bookings");
const { emitBookingChange } = require("../config/socket");

const expireBookingsJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      
      // Tìm các booking chuẩn bị hết hạn để có thông tin phát sự kiện socket
      const expiredBookings = await Booking.find({
        status: "holding",
        booking_type: "standard",
        expires_at: { $lt: now },
      });

      if (expiredBookings.length > 0) {
        const expiredIds = expiredBookings.map((b) => b._id);
        const result = await Booking.updateMany(
          { _id: { $in: expiredIds } },
          {
            $set: {
              status: "cancelled",
              cancelled_by: "system",
              cancel_at: now,
              hold_token: null,
              hold_owner: null,
              expires_at: null,
            },
          },
        );

        console.log(
          `[expireBookingsJob] Đã tự động hủy ${result.modifiedCount} booking giữ chỗ quá hạn.`,
        );

        // Phát sự kiện socket để giải phóng ô trên lịch của tất cả client
        for (const booking of expiredBookings) {
          booking.status = "cancelled";
          emitBookingChange("cancel", booking);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chạy cron job expireBookingsJob:", error);
    }
  });
};

module.exports = expireBookingsJob;
