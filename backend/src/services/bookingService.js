const mongoose = require("mongoose");
const crypto = require("crypto");
const querystring = require("qs");
const { parseISO, isValid, isBefore, addMinutes } = require("date-fns");
const { format, toZonedTime } = require("date-fns-tz");
const { differenceInHours } = require("date-fns");
const Booking = require("../models/bookings");
const Court = require("../models/court");
const Order = require("../models/orders");
const PricingRule = require("../models/pricing_rules");
const AuditLog = require("../models/audit_logs");
const User = require("../models/users");
TIMEZONE = "Asia/Ho_Chi_Minh";

const getBookings = async (query, user) => {
  const { branch_id, date, court_id, page = 1, limit = 100 } = query;

  if (date === null || date === undefined) {
    const date = new Date();
  }
  const filter = {
    is_deleted: false,
    status: { $ne: "cancelled" },
  };

  if (branch_id) {
    filter.branch_id = branch_id;
  }

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

const getBookingDetail = async (bookingId, user) => {
  const booking = await Booking.findById(bookingId)
    .populate("court_id", "name")
    .populate("user_id", "full_name email phone_number")
    .lean();
  if (!booking || booking.is_deleted) {
    const error = new Error("Không tìm thấy thông tin đặt sân");
    error.statusCode = 404;
    throw error;
  }

  const isAdminOrStaff =
    user &&
    (user.role === "admin" ||
      user.role === "staff" ||
      booking.user_id._id.toString() === user.userId);
  if (!isAdminOrStaff) {
    const error = new Error("Bạn không có quyền xem chi tiết đặt sân này");
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

const holdBooking = async (body, user) => {
  const {
    court_id,
    branch_id,
    start_time,
    end_time,
    booking_type,
    buffer_time = 10,
  } = body;

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
  // giới hạn tgian đặt sân
  const durationMins = (end.getTime() - start.getTime()) / 60000;
  if (durationMins < 60 || durationMins > 240) {
    throw new Error("Thời gian đặt sân phải từ 1 đến 4 tiếng.");
  }
  // chống spam
  const holdingCount = await Booking.countDocuments({
    user_id: user.userId,
    status: "holding",
  });

  if (holdingCount >= 3 && user.role === "customer") {
    throw new Error(
      "Bạn đã có 3 lịch giữ sân đang chờ thanh toán. Vui lòng thanh toán hoặc hủy bớt các lịch đó trước khi đặt thêm.",
    );
  }

  const court = await Court.findById(court_id);
  if (!court) {
    const error = new Error("Sân không tồn tại");
    error.statusCode = 404;
    throw error;
  }
  if (court.status !== "active" && court.tagStatus !== "available") {
    const error = new Error(
      "San hiện không thể đặt được vì đang bảo trì hoặc đã có người đặt. Vui lòng chọn sân khác hoặc liên hệ quản lý.",
    );
    error.statusCode = 400;
    throw error;
  }

  const isBookingForNow = isBefore(start, new Date(Date.now() + 5 * 60 * 1000));
  if (
    isBookingForNow &&
    user.role !== "admin" &&
    court.tagStatus !== "available"
  ) {
    const error = new Error(
      "Để đặt sân cho thời gian sắp tới, sân phải đang ở trạng thái 'available'. Vui lòng chọn sân khác hoặc liên hệ quản lý.",
    );
    error.statusCode = 400;
    throw error;
  }

  const rules = await PricingRule.find({
    branch_id,
    court_type: { $in: [court.type, "all"] },
    is_deleted: false,
  });

  if (rules.length === 0) {
    const error = new Error(
      "Chưa có cấu hình bảng giá cho chi nhánh và loại sân này.",
    );
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
    const dayType = dayOfWeek === 6 || dayOfWeek === 7 ? "weekend" : "weekday";

    const dailyRules = rules.filter((r) => r.day_type === dayType);

    const startH = parseInt(
      format(currentStart, "HH", { timeZone: TIMEZONE }),
      10,
    );
    const startM = parseInt(
      format(currentStart, "mm", { timeZone: TIMEZONE }),
      10,
    );
    const startMins = startH * 60 + startM;

    const endH = parseInt(
      format(endOfSegment, "HH", { timeZone: TIMEZONE }),
      10,
    );
    const endM = parseInt(
      format(endOfSegment, "mm", { timeZone: TIMEZONE }),
      10,
    );
    const endSeconds = parseInt(
      format(endOfSegment, "ss", { timeZone: TIMEZONE }),
      10,
    );
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
      // Tính giá động
      if (overlapStart < overlapEnd) {
        const overlapDurationMins = overlapEnd - overlapStart;
        totalPrice += (overlapDurationMins / 60) * rule.price_per_hour;
        dayCalculatedMins += overlapDurationMins;
        console.log(
          `Áp dụng rule ${rule._id} cho khoảng ${overlapStart} - ${overlapEnd} (${overlapDurationMins} phút) với giá ${rule.price_per_hour}/giờ`,
        );
      }
    }
    // ss tgian
    const segmentDuration = endMins - startMins;
    console.log(
      "dayCalculatedMins:",
      dayCalculatedMins,
      "segmentDuration:",
      segmentDuration,
    );

    if (dayCalculatedMins < segmentDuration) {
      const error = new Error(
        `Có khung giờ chưa được thiết lập giá vào ngày ${currentStart.toLocaleDateString()}. Vui lòng liên hệ quản lý.`,
      );
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

  // AICD transaction vs overlap
  const session = await mongoose.startSession();

  try {
    let createdBooking = null;
    let createdOrder = null;
    // dùng Replica Set
    await session.withTransaction(async () => {
      const bufferMs = buffer_time * 60 * 1000;
      const endWithNewBuffer = new Date(end.getTime() + bufferMs);
      // xây dựng overlap
      const conflictBooking = await Booking.findOne({
        court_id,
        is_deleted: false,
        status: { $ne: "cancelled" },
        $expr: {
          $and: [
            // start < end_time + buffer_time
            {
              $lt: [
                start,
                { $add: ["$end_time", { $multiply: ["$buffer_time", 60000] }] },
              ],
            },
            // end > start_time
            { $gt: [endWithNewBuffer, "$start_time"] },
          ],
        },
      }).session(session);

      if (conflictBooking) {
        const error = new Error(
          "Sân đã có người đặt (hoặc đang trong thời gian dọn sân) trong khoảng thời gian này.",
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
        { session },
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
      is_temporary: true,
    };

    await AuditLog.create({
      action: "create_booking",
      user_id: user.userId,
      target_collection: "bookings",
      target_id: createdBooking._id,
      old_value: null,
      new_value: {
        user_id: createdBooking.user_id,
        court_id: createdBooking.court_id,
        branch_id: createdBooking.branch_id,
        start_time: createdBooking.start_time,
        end_time: createdBooking.end_time,
        status: createdBooking.status,
        deposit_amount: createdBooking.deposit_amount,
        total_court_price: createdBooking.total_court_price,
        hold_token: createdBooking.hold_token,
      },
      is_deleted: false,
    });

    return {
      booking_id: createdBooking._id,
      status: createdBooking.status,
      total_court_price: createdBooking.total_court_price,
      deposit_amount: createdBooking.deposit_amount,
      hold_token: createdBooking.hold_token,
      expires_at: createdBooking.status === "holding" ? expires_at : null,
      order: createdOrder ? createdOrder : draftOrder,
    };
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

const createDepositPaymentUrl = async (bookingId, body, req, user) => {
  const { payment_method, redirect_url } = body;

  if (payment_method !== "vnpay") {
    const error = new Error("Phương thức thanh toán không được hỗ trợ");
    error.statusCode = 400;
    throw error;
  }
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.is_deleted)
    throw new Error("Không tìm thấy thông tin đặt sân");

  const currentUserId = user.userId;
  if (booking.user_id.toString() !== currentUserId) {
    throw new Error("Bạn không có quyền thanh toán cho lịch đặt sân này");
  }

  if (booking.status !== "holding") {
    throw new Error(
      "Chỉ những lịch đặt đang giữ chỗ mới có thể thanh toán cọc",
    );
  }
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL;

  let ipAddr =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  if (ipAddr === "::1") {
    ipAddr = "127.0.0.1";
  }

  const now = new Date();
  const createDate = format(toZonedTime(now, TIMEZONE), "yyyyMMddHHmmss");
  const expireDate = format(
    toZonedTime(new Date(now.getTime() + 10 * 60 * 1000), TIMEZONE),
    "yyyyMMddHHmmss",
  );

  const amount = Math.round(booking.deposit_amount * 100);

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: booking._id.toString(),
    vnp_OrderInfo: `Thanh toan tien coc lich dat san ${booking._id}`,
    vnp_OrderType: "billpayment",
    vnp_Amount: amount,
    vnp_ReturnUrl: redirect_url,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  console.log("=== DỮ LIỆU GỬI SANG VNPAY ===");
  console.log(vnp_Params);
  // sắp xếp params vs tạo chữ kí
  vnp_Params = sortObject(vnp_Params);
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl =
    vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: false });

  return {
    payment_url: paymentUrl,
    expires_at: addMinutes(now, 10),
  };
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) str.push(encodeURIComponent(key));
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const confirmBookingDeposit = async (bookingId, vnp_Amount) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        throw new Error("01");
      }

      if (booking.deposit_amount !== vnp_Amount) {
        throw new Error("04");
      }

      if (booking.status !== "holding") {
        throw new Error("02");
      }

      booking.status = "deposited";
      booking.hold_token = null;
      booking.payment_method = "vnpay";
      await booking.save({ session });

      await Order.create(
        [
          {
            booking_id: booking._id,
            user_id: booking.user_id,
            branch_id: booking.branch_id,
            total_court_fee: booking.total_court_price,
            total_pos_fee: 0,
            deposit_paid: booking.deposit_amount,
            final_amount_due:
              booking.total_court_price - booking.deposit_amount,
            payment_status: "deposit_paid",
            is_temporary: false,
          },
        ],
        { session },
      );
      await AuditLog.create({
        action: "pay_deposit",
        user_id: booking.user_id,
        target_collection: "bookings",
        target_id: booking._id,
        old_value: {
          status: "holding",
          deposit_amount: booking.deposit_amount,
        },
        new_value: {
          status: "deposited",
          deposit_amount: booking.deposit_amount,
        },
        is_deleted: false,
      });
    });

    return true;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

const updateBookingStatus = async (bookingId, newStatus, user) => {
  const session = await mongoose.startSession();

  try {
    let updatedBooking = null;

    await session.withTransaction(async () => {
      const booking = await Booking.findOne({
        _id: bookingId,
        is_deleted: false,
      }).session(session);

      if (!booking) {
        const error = new Error("Không tìm thấy thông tin đặt sân");
        error.statusCode = 404;
        throw error;
      }

      const currentStatus = booking.status;
      const now = new Date();
      let isValidTransition = false;
      let errorMessage = "";
      let actionName = "";
      // ktr trạng thái
      if (newStatus === "playing") {
        if (currentStatus === "deposited") {
          isValidTransition = true;
          actionName = "check_in_booking";
        } else {
          errorMessage = `Không thể check-in. Trạng thái hiện tại đang là '${currentStatus}', yêu cầu phải là 'deposited'.`;
        }

        // Kiểm tra thời gian check-in
        const diffMins = (booking.start_time - now) / (1000 * 60);
        if (diffMins > 30 && user.role !== "admin" && user.role !== "staff") {
          const error = new Error(
            "Còn quá sớm để check-in. Vui lòng quay lại trước giờ bắt đầu 30 phút.",
          );
          error.statusCode = 400;
          throw error;
        }

        await Court.findByIdAndUpdate(
          booking.court_id,
          { tagStatus: "playing" },
          { session },
        );
      }

      // Xử lý nếu trạng thái chuyển đổi không hợp lệ
      if (!isValidTransition) {
        const error = new Error(errorMessage);
        error.statusCode = 400;
        throw error;
      }

      // Lưu lại thông tin Booking
      booking.status = newStatus;
      await booking.save({ session });

      // Lưu AuditLog
      await AuditLog.create(
        [
          {
            action: actionName,
            user_id: user.userId,
            target_collection: "bookings",
            target_id: booking._id,
            old_value: { status: currentStatus },
            new_value: { status: newStatus },
          },
        ],
        { session },
      );

      updatedBooking = booking;
    });

    return updatedBooking;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

const cancelBooking = async (bookingId, reason, user) => {
  const session = await mongoose.startSession();

  try {
    const cancelledBooking = await session.withTransaction(async () => {
      const booking = await Booking.findOne({
        _id: bookingId,
        is_deleted: false,
      }).session(session);

      if (!booking) {
        const error = new Error("Không tìm thấy thông tin đặt sân");
        error.statusCode = 404;
        throw error;
      }
      const now = new Date();
      //customer chỉ đc hủy hóa đơn của mình
      if (user.role === "customer") {
        if (booking.user_id.toString() !== user.userId) {
          const error = new Error("Bạn không có quyền hủy lịch đặt sân này");
          error.statusCode = 403;
          throw error;
        }

        if (now >= booking.start_time) {
          const error = new Error(
            "Đã qua giờ bắt đầu, bạn không thể tự hủy lịch. Vui lòng liên hệ quản lý.",
          );
          error.statusCode = 400;
          throw error;
        }
      }

      //ktr status cho phép hủy
      const allowedStatuses = ["holding", "deposited"];
      if (!allowedStatuses.includes(booking.status)) {
        const error = new Error(
          `Không thể hủy lịch khi đang ở trạng thái '${booking.status}'`,
        );
        error.statusCode = 400;
        throw error;
      }

      const currentStatus = booking.status;

      let refundPercentage = 0;
      let isRefundable = false;
      let refundAmount = 0;
      //logic hoàn cọc (chỉ hoàn cọc khi đã thanh toán cọc)
      if (currentStatus === "deposited") {
        const hoursUntilStart =
          (booking.start_time.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilStart >= 6) {
          booking.refund_status = "pending";
          refundPercentage = 100;
          isRefundable = true;
        } else if (hoursUntilStart >= 3 && hoursUntilStart < 6) {
          booking.refund_status = "pending";
          refundPercentage = 70;
          isRefundable = true;
        } else {
          booking.refund_status = "none";
          refundPercentage = 0;
          isRefundable = false;
        }
        if (isRefundable) {
          refundAmount = Math.round(
            (booking.deposit_amount * refundPercentage) / 100,
          );
        }
      } else {
        booking.refund_status = "none";
        refundPercentage = 0;
        isRefundable = false;
      }

      const credit = await User.findOne({ _id: user.userId })
        .select("credit")
        .lean();
      user.credit = (credit?.credit || 0) + refundAmount;
      await User.updateOne(
        { _id: user.userId },
        { credit: user.credit },
        { session },
      );

      console.log(
        `Hủy booking ${booking._id} - refundAmount: ${refundAmount}, refundPercentage: ${refundPercentage}%, isRefundable: ${isRefundable}, user credit sau khi hoàn cọc: ${user.credit}`,
      );

      // cập nhật thông tin
      booking.status = "cancelled";
      booking.cancel_at = now;
      booking.refund_status = "refunded";
      booking.cancelled_by = user.userId;
      // trả sân
      if (
        now >= new Date(booking.start_time.getTime() - 30 * 60000) &&
        now <= booking.end_time
      ) {
        await Court.findByIdAndUpdate(
          booking.court_id,
          { tagStatus: "available" },
          { session },
        );
      }

      await booking.save({ session });

      // lưu log
      await AuditLog.create(
        [
          {
            action: "cancel_booking",
            user_id: user.userId,
            target_collection: "bookings",
            target_id: booking._id,
            old_value: {
              status: currentStatus,
              refund_status: "none",
            },
            new_value: {
              status: "cancelled",
              refund_status: booking.refund_status,
              reason: reason,
              refund_percentage: refundPercentage,
              refund_amount: refundAmount,
            },
            is_deleted: false,
          },
        ],
        { session: session },
      );
      return {
        booking,
        refund_action: {
          is_refundable: isRefundable,
          amount: refundAmount,
          percentage: refundPercentage,
        },
      };
    });
    return cancelledBooking;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getBookings,
  holdBooking,
  getBookingDetail,
  updateBookingStatus,
  cancelBooking,
  createDepositPaymentUrl,
  confirmBookingDeposit,
};
