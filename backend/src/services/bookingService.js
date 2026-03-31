const mongoose = require("mongoose");
const crypto = require("crypto");
const { parseISO, isValid, isBefore } = require("date-fns");
const { format, toZonedTime } = require("date-fns-tz");
const Booking = require("../models/bookings");
const Court = require("../models/court");
const PricingRule = require("../models/pricing_rules");
const TIMEZONE = "Asia/Ho_Chi_Minh";

const getBookings = async (query, user) => {
  const { branch_id, date, court_id, page = 1, limit = 100 } = query;

  const startOfDay = fromZonedTime(`${date}T00:00:00`, TIMEZONE); 
  const endOfDay = fromZonedTime(`${date}T23:59:59.999`, TIMEZONE);

  if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
    const error = new Error("date không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const filter = {
    branch_id,
    is_deleted: false,
    status: { $ne: "cancelled" },
    $and: [
      { start_time: { $lt: endOfDay } },
      { end_time: { $gt: startOfDay } },
    ],
  };

  if (court_id) {
    filter.court_id = court_id;
  }

  const skip = (page - 1) * limit;

  const [bookings, total_records] = await Promise.all([
    Booking.find(filter)
      .populate("court_id", "name")
      .populate("user_id", "full_name")
      .sort({ start_time: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  const isAdminOrStaff =
    user && (user.role === "admin" || user.role === "staff");

  const sanitizedData = bookings.map((booking) => {
    if (!isAdminOrStaff) {
      return {
        ...booking,
        user_id: {
          _id: null,
          full_name: "Khách đặt",
        },
      };
    }
    return booking;
  });

  return {
    data: sanitizedData,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total_records,
      total_pages: Math.ceil(total_records / limit),
    },
  };
};

const holdBooking = async (body, user) => {
  const { court_id, branch_id, start_time, end_time, booking_type, buffer_time = 10 } = body;

  const start = parseISO(start_time);
  const end = parseISO(end_time);
  const now = new Date();

  if (!isValid(start) || !isValid(end)) {
    const error = new Error("start_time hoặc end_time không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  if (!isBefore(start, end)) {
    const error = new Error("start_time phải nhỏ hơn end_time");
    error.statusCode = 400;
    throw error;
  }

  if (isBefore(start, now)) {
    const error = new Error("Không thể giữ chỗ trong quá khứ");
    error.statusCode = 400;
    throw error;
  }

  // Tính giá động
  const court = await Court.findById(court_id);
  if (!court) {
    const error = new Error("Sân không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const rules = await PricingRule.find({
    branch_id,
    court_type: { $in: [court.type, "all"] },
    is_deleted: false,
  });

  if (rules.length === 0) {
    const error = new Error("Chưa có cấu hình bảng giá cho chi nhánh và loại sân này.");
    error.statusCode = 400;
    throw error;
  }

  let totalPrice = 0;
  let currentStart = new Date(start);
// loop tính theo ngày
  while (currentStart < end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setHours(23, 59, 59, 999);
    const endOfSegment = isBefore(end, currentEnd) ? end : currentEnd;

    // ktr type
    const dayOfWeekStr = format(currentStart, "i", { timeZone: TIMEZONE });
    const dayOfWeek = parseInt(dayOfWeekStr, 10);
    const dayType = (dayOfWeek === 6 || dayOfWeek === 7) ? "weekend" : "weekday";

    const dailyRules = rules.filter((r) => r.day_type === dayType);

    const startH = parseInt(format(currentStart, "HH", { timeZone: TIMEZONE }), 10);
    const startM = parseInt(format(currentStart, "mm", { timeZone: TIMEZONE }), 10);
    const startMins = startH * 60 + startM;

    const endH = parseInt(format(endOfSegment, "HH", { timeZone: TIMEZONE }), 10);
    const endM = parseInt(format(endOfSegment, "mm", { timeZone: TIMEZONE }), 10);
    const endSeconds = parseInt(format(endOfSegment, "ss", { timeZone: TIMEZONE }), 10);
    const endMins = endH * 60 + endM + (endSeconds > 0 ? 1 : 0);

    let dayCalculatedMins = 0;
    // loop con overlap
    for (const rule of dailyRules) {
      const [rStartH, rStartM] = rule.start_time.split(":").map(Number);
      const [rEndH, rEndM] = rule.end_time.split(":").map(Number);

      const ruleStartMins = rStartH * 60 + rStartM;
      let ruleEndMins = rEndH * 60 + rEndM;
      if (rule.end_time === "23:59" || rule.end_time === "24:00") {
        ruleEndMins = 24 * 60; 
      }

      const overlapStart = Math.max(startMins, ruleStartMins);
      const overlapEnd = Math.min(endMins, ruleEndMins);
      // tổng giá
      if (overlapStart < overlapEnd) {
        const overlapDurationMins = overlapEnd - overlapStart;
        totalPrice += (overlapDurationMins / 60) * rule.price_per_hour;
        dayCalculatedMins += overlapDurationMins;
      }
    }
    // ss tgian
    const segmentDuration = endMins - startMins;
    if (dayCalculatedMins < segmentDuration) {
      const error = new Error(`Có khung giờ chưa được thiết lập giá vào ngày ${currentStart.toLocaleDateString()}. Vui lòng liên hệ quản lý.`);
      error.statusCode = 400;
      throw error;
    }

    currentStart = new Date(currentEnd.getTime() + 1);
  }

  const total_court_price = Math.round(totalPrice);
  const deposit_amount = Math.round(total_court_price * 0.5); 
  const hold_token = crypto.randomUUID();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  // khách vãng lai hoặc customer phải chờ thanh toán cọc
  let initialPaymentStatus = "pending_deposit";
  let initialDepositPaid = 0;
  let initialStatus = "holding";
  let finalHoldToken = hold_token;

  if (user.role === "admin" || user.role === "staff") {
    initialPaymentStatus = "deposit_paid";
    initialDepositPaid = deposit_amount;
    initialStatus = "deposited"; 
    finalHoldToken = null;
  }

  // UPDATE thanh toán cọc(chưa có trang thanh toán)

  // AICD transaction vs overlap
  const session = await mongoose.startSession();

  try {
    let createdBooking = null;
    // dùng Replica Set
    await session.withTransaction(async () => {
      
      // xây dựng overlap   
      const conflictBooking = await Booking.findOne({
        court_id,
        is_deleted: false,
        status: { $ne: "cancelled" },
        $expr: {
          $and: [
            // start < end_time + buffer_time
            { $lt: [ start, { $add: ["$end_time", { $multiply: ["$buffer_time", 60000] }] } ] },
            // end > start_time
            { $gt: [ end, "$start_time" ] }
          ]
        }
      }).session(session);

      if (conflictBooking) {
        const error = new Error(
          "Sân đã có người đặt (hoặc đang trong thời gian dọn sân) trong khoảng thời gian này."
        );
        error.statusCode = 409;
        error.errorCode = "ERR_COURT_CONFLICT";
        throw error;
      }

      const createdDocs = await Booking.create(
        [
          {
            user_id: user.userId,
            court_id,
            branch_id,
            start_time: start,
            end_time: end,
            buffer_time: buffer_time,
            booking_type,
            status: initialStatus,  
            deposit_amount,
            total_court_price,
            hold_token: finalHoldToken,  
            hold_owner: user.userId,
          },
        ],
        { session }
      );

      createdBooking = createdDocs[0];
    });
    const draftOrder = {
          booking_id: createdBooking._id,
          user_id: user.userId,
          branch_id: branch_id,
          total_court_fee: total_court_price,
          total_pos_fee: 0, 
          deposit_paid: initialDepositPaid,
          final_amount_due: total_court_price - initialDepositPaid,
          payment_status: initialPaymentStatus,
          is_temporary: true
    };

    return {
      booking_id: createdBooking._id,
      status: createdBooking.status,
      total_court_price: createdBooking.total_court_price,
      deposit_amount: createdBooking.deposit_amount,
      hold_token: createdBooking.hold_token,
      expires_at: createdBooking.status === "holding" ? expires_at : null, 
      draft_order: draftOrder
    };
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { getBookings, holdBooking };