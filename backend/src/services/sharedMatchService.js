const mongoose = require("mongoose");
const SharedMatch = require("../models/sharedMatch");
const SharedTicket = require("../models/sharedTicket");
const Booking = require("../models/bookings");
const User = require("../models/users");
const crypto = require("crypto");
const querystring = require("qs");
const { addMinutes } = require("date-fns");
const { format, toZonedTime } = require("date-fns-tz");

const TIMEZONE = "Asia/Ho_Chi_Minh";
const SHARED_TICKET_PENDING_MINUTES = 10;
const SHARED_TICKET_FULL_REFUND_HOURS = 5;
const SHARED_TICKET_HALF_REFUND_HOURS = 2;

const sortObject = (obj) => {
  const sorted = {};
  const keys = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(encodeURIComponent(key));
    }
  }

  keys.sort();

  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }

  return sorted;
};
const createError = (message, statusCode, errorCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errorCode) error.errorCode = errorCode;
  return error;
};
const calculateSharedTicketRefund = (startTime, paidAmount, now = new Date()) => {
  const hoursUntilStart =
    (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 0;
  if (hoursUntilStart >= SHARED_TICKET_FULL_REFUND_HOURS) {
    refundPercentage = 100;
  } else if (hoursUntilStart >= SHARED_TICKET_HALF_REFUND_HOURS) {
    refundPercentage = 50;
  }

  return {
    is_refundable: refundPercentage > 0,
    amount: Math.round((paidAmount * refundPercentage) / 100),
    percentage: refundPercentage,
    hours_until_start: hoursUntilStart,
  };
};
const createSharedMatch = async (data) => {
  const {
    court_id,
    branch_id,
    start_time,
    end_time,
    ticket_price,
    max_slots,
    user_id,
  } = data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const start = new Date(start_time);
    const end = new Date(end_time);

    const overlappingBooking = await Booking.findOne({
      court_id,
      status: { $nin: ["cancelled"] },
      start_time: { $lt: end },
      end_time: { $gt: start },
      is_deleted: false,
    }).session(session);

    if (overlappingBooking) {
      throw createError("Khung giờ này đã có người đặt sân.", 400);
    }

    const newBooking = new Booking({
      court_id,
      branch_id,
      user_id,
      start_time: start,
      end_time: end,
      status: "deposited",
      booking_type: "shared_match",
      total_court_price: 0,
      deposit_amount: 0,
      expires_at: null,
    });
    await newBooking.save({ session });

    const sharedMatch = new SharedMatch({
      booking_id: newBooking._id,
      status: "recruiting",
      ticket_price: Number(ticket_price),
      max_slots: Number(max_slots),
      booked_slots: 0,
    });
    await sharedMatch.save({ session });

    await session.commitTransaction();

    return {
      sharedMatch,
      booking: newBooking,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
const getSharedMatches = async (query) => {
  const {
    branch_id,
    status = "recruiting",
    page = 1,
    limit = 10,
  } = query;
  const skip = (page - 1) * limit;

  const bookingFilter = {
    is_deleted: false,
    status: { $ne: "cancelled" },
  };
  if (branch_id) {
    bookingFilter.branch_id = branch_id;
  }

  const bookings = await Booking.find(bookingFilter).select("_id");
  const bookingIds = bookings.map((booking) => booking._id);

  const sharedMatchFilter = {
    status,
    booking_id: { $in: bookingIds },
  };

  const total_records = await SharedMatch.countDocuments(sharedMatchFilter);
  const sharedMatches = await SharedMatch.find(sharedMatchFilter)
    .populate({
      path: "booking_id",
      select: "court_id branch_id start_time end_time status booking_type",
    })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  return {
    message: "Lấy danh sách sân ghép thành công",
    data: sharedMatches,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total_records,
      total_pages: Math.ceil(total_records / Number(limit)),
    },
  };
};
const getSharedMatchById = async (id) => {
  return SharedMatch.findOne({
    _id: id,
    is_deleted: false,
  }).populate({
    path: "booking_id",
    select: "court_id branch_id start_time end_time status booking_type",
  });
};
const validateCanJoinSharedMatch = async (sharedMatchId, session = null) => {
  const query = SharedMatch.findOne({
    _id: sharedMatchId,
    is_deleted: false,
  }).select("status max_slots booked_slots");

  if (session) query.session(session);

  const sharedMatch = await query;

  if (!sharedMatch) {
    throw createError("Sân ghép không tồn tại", 404);
  }

  if (sharedMatch.status !== "recruiting") {
    throw createError("Ca ghép hiện không nhận thêm người chơi", 400);
  }

  if (sharedMatch.booked_slots >= sharedMatch.max_slots) {
    throw createError("Ca sân ghép này đã đủ số lượng người chơi.", 409, "ERR_MATCH_FULL");
  }

  return sharedMatch;
};
const lockSharedMatchIfFull = async (sharedMatch, session) => {
  if (sharedMatch.booked_slots < sharedMatch.max_slots) {
    return sharedMatch;
  }

  if (sharedMatch.status !== "locked") {
    sharedMatch.status = "locked";
    await sharedMatch.save({ session });
  }

  return sharedMatch;
};
const autoLockSharedMatch = async (sharedMatchId, session) => {
  if (!session) {
    throw new Error("autoLockSharedMatch yêu cầu mongoose transaction session");
  }

  const paidTicketsCount = await SharedTicket.countDocuments({
    shared_match_id: sharedMatchId,
    payment_status: "paid",
    is_deleted: false,
  }).session(session);

  const sharedMatch = await SharedMatch.findOne({
    _id: sharedMatchId,
    is_deleted: false,
  })
    .select("status max_slots booked_slots")
    .session(session);

  if (!sharedMatch) {
    throw createError("Sân ghép không tồn tại", 404);
  }

  if (
    sharedMatch.status === "recruiting" &&
    paidTicketsCount >= sharedMatch.max_slots
  ) {
    sharedMatch.status = "locked";
    sharedMatch.booked_slots = Math.max(sharedMatch.booked_slots, paidTicketsCount);
    await sharedMatch.save({ session });
  }

  return {
    locked: sharedMatch.status === "locked",
    paidTicketsCount,
    maxSlots: sharedMatch.max_slots,
  };
};
const buildSharedTicketPaymentUrl = (ticket, body, req) => {
  const { payment_method, redirect_url } = body;

  if (payment_method !== "vnpay") {
    throw createError("Phương thức thanh toán không được hỗ trợ", 400);
  }

  const ticketExpiresAt = ticket.expires_at || addMinutes(ticket.createdAt, SHARED_TICKET_PENDING_MINUTES);
  if (ticketExpiresAt <= new Date()) {
    throw createError("Vé đang chờ thanh toán đã hết hạn", 400);
  }

  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL;

  if (!tmnCode || !secretKey || !vnpUrl) {
    throw createError("Thiếu cấu hình VNPay", 500);
  }

  let ipAddr =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

  if (ipAddr === "::1") {
    ipAddr = "127.0.0.1";
  }

  const now = new Date();
  const createDate = format(toZonedTime(now, TIMEZONE), "yyyyMMddHHmmss");
  const expireDate = format(
    toZonedTime(ticketExpiresAt, TIMEZONE),
    "yyyyMMddHHmmss",
  );

  const amount = Math.round(ticket.ticket_price * 100);

  let vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: `ST_${ticket._id}`,
    vnp_OrderInfo: `Thanh toan ve ghep ${ticket._id}`,
    vnp_OrderType: "billpayment",
    vnp_Amount: amount,
    vnp_ReturnUrl: redirect_url,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  vnpParams = sortObject(vnpParams);

  const signData = querystring.stringify(vnpParams, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnpParams.vnp_SecureHash = signed;

  const paymentUrl =
    vnpUrl + "?" + querystring.stringify(vnpParams, { encode: false });

  return {
    payment_url: paymentUrl,
    expires_at: ticketExpiresAt,
  };
};
const buySharedMatchTicket = async (matchId, userId, body, req) => {
  const session = await mongoose.startSession();

  try {
    let createdTicket = null;
    let sharedMatch = null;

    await session.withTransaction(async () => {
      sharedMatch = await SharedMatch.findOne({
        _id: matchId,
        is_deleted: false,
        status: "recruiting",
        $expr: { $lt: ["$booked_slots", "$max_slots"] },
      }).session(session);

      if (!sharedMatch) {
        throw createError(
          "Ca sân ghép này đã đủ số lượng người chơi.",
          409,
          "ERR_MATCH_FULL",
        );
      }

      const existingTicket = await SharedTicket.findOne({
        user_id: userId,
        shared_match_id: sharedMatch._id,
        is_deleted: false,
      }).session(session);

      if (existingTicket) {
        if (existingTicket.payment_status === "paid") {
          throw createError("Bạn đã có vé trong ca ghép này.", 409, "ERR_TICKET_EXISTS");
        }

        const existingExpiresAt =
          existingTicket.expires_at ||
          addMinutes(existingTicket.createdAt, SHARED_TICKET_PENDING_MINUTES);

        if (
          existingTicket.payment_status === "pending" &&
          existingExpiresAt > new Date()
        ) {
          createdTicket = existingTicket;
          return;
        }

        await SharedTicket.deleteOne({ _id: existingTicket._id }).session(session);
      }

      try {
        const ticketDocs = await SharedTicket.create(
          [
            {
              user_id: userId,
              shared_match_id: sharedMatch._id,
              payment_status: "pending",
              ticket_price: sharedMatch.ticket_price,
              expires_at: new Date(Date.now() + SHARED_TICKET_PENDING_MINUTES * 60 * 1000),
            },
          ],
          { session },
        );
        createdTicket = ticketDocs[0];
      } catch (error) {
        if (error.code === 11000) {
          throw createError("Bạn đã có vé trong ca ghép này.", 409, "ERR_TICKET_EXISTS");
        }
        throw error;
      }
    });

    return {
      ticket: createdTicket,
      sharedMatch,
      payment: buildSharedTicketPaymentUrl(createdTicket, body, req),
    };
  } finally {
    session.endSession();
  }
};
const confirmSharedTicketPayment = async (sharedTicketId, paidAmount) => {
  const session = await mongoose.startSession();

  try {
    let paidTicket = null;
    let lockResult = null;

    await session.withTransaction(async () => {
      const ticket = await SharedTicket.findOne({
        _id: sharedTicketId,
        is_deleted: false,
      }).session(session);

      if (!ticket) {
        throw createError("Vé ghép không tồn tại", 404);
      }

      if (ticket.payment_status === "paid") {
        paidTicket = ticket;
        lockResult = await autoLockSharedMatch(ticket.shared_match_id, session);
        return;
      }

      if (ticket.payment_status !== "pending") {
        throw createError("Chỉ có thể xác nhận thanh toán cho vé đang chờ thanh toán", 400);
      }

      const ticketExpiresAt = ticket.expires_at || addMinutes(ticket.createdAt, SHARED_TICKET_PENDING_MINUTES);
      if (ticketExpiresAt <= new Date()) {
        throw createError("Vé đang chờ thanh toán đã hết hạn", 400);
      }

      const normalizedPaidAmount = Number(paidAmount);

      if (!Number.isFinite(normalizedPaidAmount) || normalizedPaidAmount < 0) {
        throw createError("paid_amount không hợp lệ", 400);
      }

      if (normalizedPaidAmount !== ticket.ticket_price) {
        throw new Error("04");
      }

      const paidMatch = await SharedMatch.findOneAndUpdate(
        {
          _id: ticket.shared_match_id,
          is_deleted: false,
          status: "recruiting",
          $expr: { $lt: ["$booked_slots", "$max_slots"] },
        },
        { $inc: { booked_slots: 1 } },
        { returnDocument: "after", session },
      );

      if (!paidMatch) {
        throw createError("Ca sân ghép này đã đủ số lượng người chơi.", 409, "ERR_MATCH_FULL");
      }

      ticket.payment_status = "paid";
      ticket.paid_amount = normalizedPaidAmount;
      ticket.expires_at = null;
      await ticket.save({ session });

      if (paidMatch.booked_slots >= paidMatch.max_slots) {
        paidMatch.status = "locked";
        await paidMatch.save({ session });
      }

      lockResult = {
        locked: paidMatch.status === "locked",
        paidTicketsCount: paidMatch.booked_slots,
        maxSlots: paidMatch.max_slots,
      };
      paidTicket = ticket;
    });

    return {
      ticket: paidTicket,
      autoLock: lockResult,
    };
  } finally {
    session.endSession();
  }
};
const updateSharedMatch = async (id, data) => {
  const sharedMatch = await SharedMatch.findOne({
    _id: id,
    is_deleted: false,
  });

  if (!sharedMatch) {
    throw createError("Sân ghép không tồn tại", 404);
  }

  if (sharedMatch.status !== "recruiting") {
    throw createError("Chỉ có thể cập nhật sân ghép đang ở trạng thái recruiting", 400);
  }

  if (
    data.max_slots !== undefined &&
    Number(data.max_slots) < sharedMatch.booked_slots
  ) {
    throw createError("max_slots không được nhỏ hơn số slot đã đặt", 400);
  }

  const updatableFields = ["ticket_price", "max_slots"];
  updatableFields.forEach((field) => {
    if (data[field] !== undefined) {
      sharedMatch[field] = data[field];
    }
  });

  await sharedMatch.save();
  return sharedMatch;
};
const updateSharedMatchStatus = async (id, status) => {
  const session = await mongoose.startSession();

  try {
    let updatedMatch = null;

    await session.withTransaction(async () => {
      const sharedMatch = await SharedMatch.findOne({
        _id: id,
        is_deleted: false,
      }).session(session);

      if (!sharedMatch) {
        throw createError("Sân ghép không tồn tại", 404);
      }

      if (["completed", "cancelled"].includes(sharedMatch.status)) {
        throw createError("Không thể cập nhật trạng thái ca ghép đã kết thúc hoặc đã hủy", 400);
      }

      if (status === "completed" && sharedMatch.status !== "locked") {
        throw createError("Chỉ có thể hoàn thành ca ghép đã khóa sổ", 400);
      }

      const bookingUpdate = {};
      if (status === "completed") {
        bookingUpdate.status = "completed";
      }
      if (status === "cancelled") {
        bookingUpdate.status = "cancelled";
        bookingUpdate.cancelled_by = "system";
        bookingUpdate.cancel_at = new Date();
        bookingUpdate.expires_at = null;
      }

      if (Object.keys(bookingUpdate).length > 0) {
        await Booking.updateOne(
          {
            _id: sharedMatch.booking_id,
            is_deleted: false,
          },
          { $set: bookingUpdate },
          { session },
        );
      }

      if (status === "cancelled") {
        const paidTickets = await SharedTicket.find({
          shared_match_id: sharedMatch._id,
          payment_status: "paid",
          is_deleted: false,
        })
          .select("user_id paid_amount")
          .session(session);

        if (paidTickets.length > 0) {
          const refundOps = paidTickets
            .map((ticket) => {
              const refundAmount =
                Number(ticket.paid_amount) > 0
                  ? ticket.paid_amount
                  : sharedMatch.ticket_price;

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
        }

        await SharedTicket.updateMany(
          {
            shared_match_id: sharedMatch._id,
            payment_status: { $in: ["pending", "paid"] },
            is_deleted: false,
          },
          { $set: { payment_status: "cancelled", expires_at: null } },
          { session },
        );
      }

      sharedMatch.status = status;
      await sharedMatch.save({ session });

      updatedMatch = sharedMatch;
    });

    return updatedMatch;
  } finally {
    session.endSession();
  }
};
const cancelSharedTicket = async (ticketId, user) => {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const ticket = await SharedTicket.findOne({
        _id: ticketId,
        is_deleted: false,
      }).session(session);

      if (!ticket) {
        throw createError("Vé ghép không tồn tại", 404);
      }

      const isOwner = ticket.user_id.toString() === user.userId;
      const canStaffCancel = ["admin", "manager", "staff"].includes(user.role);

      if (!isOwner && !canStaffCancel) {
        throw createError("Bạn không có quyền hủy vé này", 403);
      }

      if (ticket.payment_status === "cancelled") {
        return {
          ticket,
          refund_action: {
            is_refundable: false,
            amount: 0,
            percentage: 0,
          },
        };
      }

      const shouldReleaseSlot = ticket.payment_status === "paid";

      const sharedMatch = await SharedMatch.findOne({
        _id: ticket.shared_match_id,
        is_deleted: false,
      }).session(session);

      if (!sharedMatch) {
        throw createError("Sân ghép không tồn tại", 404);
      }

      const booking = await Booking.findOne({
        _id: sharedMatch.booking_id,
        is_deleted: false,
      })
        .select("start_time")
        .session(session);

      if (!booking) {
        throw createError("Không tìm thấy booking của sân ghép", 404);
      }

      const now = new Date();
      if (isOwner && now >= booking.start_time) {
        throw createError(
          "Đã đến giờ bắt đầu, bạn không thể tự hủy vé. Vui lòng liên hệ quản lý.",
          400,
        );
      }

      if (sharedMatch.status !== "recruiting") {
        throw createError("Chỉ có thể hủy vé khi ca ghép đang tuyển người", 400);
      }

      let refundAction = {
        is_refundable: false,
        amount: 0,
        percentage: 0,
      };

      if (shouldReleaseSlot && isOwner) {
        const paidAmount =
          Number(ticket.paid_amount) > 0
            ? Number(ticket.paid_amount)
            : Number(ticket.ticket_price);

        refundAction = calculateSharedTicketRefund(
          booking.start_time,
          paidAmount,
          now,
        );

        if (refundAction.amount > 0) {
          await User.updateOne(
            { _id: ticket.user_id, is_deleted: false },
            { $inc: { credit: refundAction.amount } },
            { session },
          );
        }
      }

      ticket.payment_status = "cancelled";
      ticket.expires_at = null;
      await ticket.save({ session });

      if (!shouldReleaseSlot) {
        return {
          ticket,
          refund_action: refundAction,
        };
      }

      sharedMatch.booked_slots = Math.max(0, sharedMatch.booked_slots - 1);

      await sharedMatch.save({ session });

      return {
        ticket,
        refund_action: refundAction,
      };
    });

    return result;
  } finally {
    session.endSession();
  }
};
const getSharedMatchTicket = async (shared_match_id) => {
  const sharedMatch = await SharedMatch.findOne({
    _id: shared_match_id,
    is_deleted: false,
  });
  if (!sharedMatch) {
    throw createError("Sân ghép không tồn tại", 404);
  }
  const tickets = await SharedTicket.find({
    shared_match_id: sharedMatch._id,
    payment_status: "paid",
    is_deleted: false,
  })
    .populate({
      path: "user_id",
      select: "_id full_name skill_rank",
    })
    .sort({ createdAt: 1 });

  return tickets.map((ticket) => ({
    _id: ticket._id,
    user_id: ticket.user_id,
    payment_status: ticket.payment_status,
    created_at: ticket.createdAt,
  }));
};

module.exports = {
  createSharedMatch,
  getSharedMatches,
  getSharedMatchById,
  getSharedMatchTicket,
  validateCanJoinSharedMatch,
  autoLockSharedMatch,
  confirmSharedTicketPayment,
  cancelSharedTicket,
  buySharedMatchTicket,
  updateSharedMatch,
  updateSharedMatchStatus,
};
