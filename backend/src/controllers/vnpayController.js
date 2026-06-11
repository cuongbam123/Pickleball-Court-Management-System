const crypto = require("crypto");
const querystring = require("qs");
const mongoose = require("mongoose");
const bookingService = require("../services/bookingService");
const orderService = require("../services/orderService");
const sharedMatchService = require("../services/sharedMatchService");
const tournamentsService = require("../services/tournamentsService");
const SharedTicket = require("../models/sharedTicket");
const Booking = require("../models/bookings");
const Order = require("../models/orders");

const VNPAY_FAILURE_REASONS = {
  "07": "Giao dịch bị nghi ngờ gian lận.",
  "09": "Thẻ hoặc tài khoản chưa đăng ký Internet Banking.",
  "10": "Xác thực thông tin thẻ không thành công.",
  "11": "Giao dịch đã hết hạn thanh toán.",
  "12": "Thẻ hoặc tài khoản đang bị khóa.",
  "13": "Mã OTP không chính xác.",
  "24": "Khách hàng đã hủy giao dịch.",
  "51": "Tài khoản không đủ số dư.",
  "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
  "75": "Ngân hàng đang bảo trì.",
  "79": "Nhập sai mật khẩu thanh toán quá số lần quy định.",
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const getUserId = (user) => user?.userId || user?._id || user?.id;

const ensureCanViewPayment = (resourceUserId, user, allowSignedReturn = false) => {
  if (allowSignedReturn) return;

  if (!user) {
    const error = new Error("Bạn cần đăng nhập để kiểm tra trạng thái thanh toán");
    error.status = 401;
    throw error;
  }

  if (["admin", "staff"].includes(user.role)) return;

  const currentUserId = getUserId(user);
  if (!currentUserId || resourceUserId.toString() !== currentUserId.toString()) {
    const error = new Error("Bạn không có quyền xem giao dịch này");
    error.status = 403;
    throw error;
  }
};

const getFailureReason = (responseCode) =>
  VNPAY_FAILURE_REASONS[responseCode] ||
  `VNPay trả về mã lỗi ${responseCode || "không xác định"}`;

const verifySignedReturnParams = (query, expectedTxnRef) => {
  if (!query?.vnp_SecureHash) {
    return {
      hasSignedParams: false,
      isValid: false,
      responseCode: null,
    };
  }

  let vnpParams = { ...query };
  const secureHash = vnpParams.vnp_SecureHash;

  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  vnpParams = sortObject(vnpParams);

  const signData = querystring.stringify(vnpParams, { encode: false });
  const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return {
    hasSignedParams: true,
    isValid:
      secureHash === signed &&
      (!expectedTxnRef || vnpParams.vnp_TxnRef === expectedTxnRef),
    responseCode: vnpParams.vnp_ResponseCode,
  };
};

const getPaymentStatus = async (req, res, next) => {
  try {
    const txnRef = String(req.params.txnRef || "").trim();

    if (!txnRef) {
      const error = new Error("Thiếu mã giao dịch VNPay");
      error.status = 400;
      throw error;
    }

    // 1. Xác thực chữ ký từ URL params (Tránh fake responseCode)
    const signedReturn = verifySignedReturnParams(req.query, txnRef);
    if (signedReturn.hasSignedParams && !signedReturn.isValid) {
      const error = new Error("Dữ liệu trả về từ VNPay không hợp lệ");
      error.status = 400;
      throw error;
    }

    const allowSignedReturn = signedReturn.hasSignedParams && signedReturn.isValid;
    const isVnpaySuccess = allowSignedReturn && signedReturn.responseCode === "00";
    const isVnpayFailed = allowSignedReturn && signedReturn.responseCode !== "00";

    const isFinalPayment = txnRef.startsWith("O_");
    const isSharedTicketPayment = txnRef.startsWith("ST_");
    const referenceId = isSharedTicketPayment
      ? txnRef.slice(3)
      : isFinalPayment
        ? txnRef.slice(2)
        : txnRef;

    if (!mongoose.Types.ObjectId.isValid(referenceId)) {
      const error = new Error("Mã giao dịch không đúng định dạng");
      error.status = 400;
      throw error;
    }
    // --- TRƯỜNG HỢP 0: THANH TOÁN VÉ SÂN GHÉP ---
    if (isSharedTicketPayment) {
      const ticket = await SharedTicket.findOne({
        _id: referenceId,
        is_deleted: false,
      }).lean();

      if (!ticket) {
        const error = new Error("Không tìm thấy vé sân ghép");
        error.status = 404;
        throw error;
      }

      ensureCanViewPayment(ticket.user_id, req.user, allowSignedReturn);

      let paymentStatus = ticket.payment_status || "pending";
      let failureReason = null;

      if (ticket.payment_status === "paid" || isVnpaySuccess) {
        paymentStatus = "paid";
      } else if (isVnpayFailed) {
        paymentStatus = "failed";
        failureReason = getFailureReason(signedReturn.responseCode);
      } else if (ticket.payment_status === "cancelled") {
        paymentStatus = "failed";
        failureReason = "Vé sân ghép đã bị hủy hoặc hết hạn thanh toán.";
      }

      return res.status(200).json({
        success: true,
        message: "Kiểm tra trạng thái thanh toán vé sân ghép thành công",
        data: {
          txn_ref: txnRef,
          payment_type: "shared_match",
          ticket_id: ticket._id,
          shared_match_id: ticket.shared_match_id,
          payment_status: paymentStatus,
          amount: ticket.paid_amount || ticket.ticket_price,
          ticket_price: ticket.ticket_price,
          failure_reason: failureReason,
        },
      });
    }

    // --- TRƯỜNG HỢP 1: THANH TOÁN TỔNG BILL (FINAL PAYMENT) ---
    if (isFinalPayment) {
      let order = await Order.findOne({ _id: referenceId, is_deleted: false })
        .populate("booking_id", "status start_time end_time")
        .lean();

      if (!order) {
        const error = new Error("Không tìm thấy hóa đơn");
        error.status = 404;
        throw error;
      }

      ensureCanViewPayment(order.user_id, req.user, allowSignedReturn);

      // Fallback confirmation on read if VNPay confirmed success
      if (isVnpaySuccess) {
        try {
          await orderService.confirmOrderFinalPayment(order._id.toString(), order.final_amount_due, req.query.vnp_TransactionNo);
          // Re-fetch order
          order = await Order.findOne({ _id: referenceId, is_deleted: false })
            .populate("booking_id", "status start_time end_time")
            .lean();
        } catch (error) {
          if (error.message !== "02") {
            console.error("Lỗi xác nhận thanh toán hóa đơn trong getPaymentStatus:", error);
          }
        }
      }

      // Ưu tiên Success nếu DB đã update HOẶC URL VNPay báo thành công
      let paymentStatus = order.payment_status;
      let failureReason = null;

      if (order.payment_status === "fully_paid" || isVnpaySuccess) {
        paymentStatus = "fully_paid";
      } else if (isVnpayFailed) {
        paymentStatus = "failed";
        failureReason = getFailureReason(signedReturn.responseCode);
      }

      return res.status(200).json({
        success: true,
        message: "Kiểm tra trạng thái thanh toán thành công",
        data: {
          txn_ref: txnRef,
          order_id: order._id,
          booking_id: order.booking_id?._id || order.booking_id,
          payment_status: paymentStatus,
          booking_status: order.booking_id?.status || null,
          amount: order.final_amount_due,
          deposit_paid: order.deposit_paid,
          final_amount_due: order.final_amount_due,
          total_court_fee: order.total_court_fee,
          failure_reason: failureReason,
        },
      });
    }

    // --- TRƯỜNG HỢP 2: THANH TOÁN CỌC (DEPOSIT) --- 
    let booking = await Booking.findOne({ _id: referenceId, is_deleted: false }).lean();
    if (!booking) {
      const error = new Error("Không tìm thấy lịch đặt sân");
      error.status = 404;
      throw error;
    }

    ensureCanViewPayment(booking.user_id, req.user, allowSignedReturn);

    // Fallback confirmation on read if VNPay confirmed success
    if (isVnpaySuccess) {
      try {
        await bookingService.confirmBookingDeposit(booking._id.toString(), booking.deposit_amount, req.query.vnp_TransactionNo);
        // Re-fetch booking after update to get the latest status
        booking = await Booking.findOne({ _id: referenceId, is_deleted: false }).lean();
      } catch (error) {
        if (error.message !== "02") {
          console.error("Lỗi xác nhận thanh toán cọc trong getPaymentStatus:", error);
        }
      }
    }

    const order = await Order.findOne({
      booking_id: booking._id,
      is_deleted: false,
    }).lean();

    // Logic quan trọng: Nếu VNPay báo 00 và chữ ký khớp -> Ép trạng thái về deposit_paid
    const isDepositPaid =
      booking.status === "deposited" ||
      ["deposit_paid", "pending_final", "fully_paid"].includes(order?.payment_status) ||
      isVnpaySuccess;

    let paymentStatus = order?.payment_status || "pending_deposit";
    let failureReason = null;

    if (isDepositPaid) {
      console.log("Deposit paid")
      paymentStatus = "deposit_paid";
    } else if (isVnpayFailed) {
      console.log("Deposit failed")
      paymentStatus = "failed";
      failureReason = getFailureReason(signedReturn.responseCode);
    } else if (booking.status === "cancelled") {
      console.log("Booking cancelled")
      paymentStatus = "failed";
      failureReason = "Lịch giữ sân đã bị hủy hoặc hết hạn thanh toán.";
    }

    return res.status(200).json({
      success: true,
      message: "Kiểm tra trạng thái thanh toán thành công",
      data: {
        txn_ref: txnRef,
        order_id: order?._id || null,
        booking_id: booking._id,
        payment_status: paymentStatus,
        booking_status: booking.status,
        amount: isDepositPaid ? (order?.deposit_paid || booking.deposit_amount) : booking.deposit_amount,
        deposit_paid: order?.deposit_paid || 0,
        final_amount_due: order?.final_amount_due ?? booking.total_court_price,
        total_court_fee: order?.total_court_fee ?? booking.total_court_price,
        failure_reason: failureReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

const vnpayIpn = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  
  const secretKey = process.env.VNP_HASH_SECRET;
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash !== signed) {
    return res.status(200).json({ RspCode: "97", Message: "Checksum failed" }); 
  }

  const txnRef = vnp_Params["vnp_TxnRef"];
  const vnp_Amount = vnp_Params["vnp_Amount"] / 100; 
  const responseCode = vnp_Params["vnp_ResponseCode"];

  if (responseCode === "00") {
    try {
      // BỘ ĐỊNH TUYẾN THÔNG MINH
      if (txnRef.startsWith("O_")) {
        // 1. THANH TOÁN TỔNG BILL (ORDER)
        console.log("ở đây")
        const orderId = txnRef.split("O_")[1]; // Cắt bỏ chữ O_ để lấy ID thật
        await orderService.confirmOrderFinalPayment(orderId, vnp_Amount, vnp_Params["vnp_TransactionNo"]);
      }
      else if (txnRef.startsWith("ST_")) {
        const ticketId = txnRef.split("ST_")[1];
        await sharedMatchService.confirmSharedTicketPayment(ticketId, vnp_Amount);
      }
      else if (txnRef.startsWith("TP_")) {
        // 3. THANH TOÁN GIẢI ĐẤU (TOURNAMENT)
        const participantId = txnRef.split("TP_")[1]; // Cắt bỏ chữ TP_ để lấy ID thật
        const vnp_TransactionNo = vnp_Params["vnp_TransactionNo"];
        await tournamentsService.confirmTournamentPayment(participantId, vnp_Amount, vnp_TransactionNo);
      }
      else {
        // 2. THANH TOÁN CỌC BAN ĐẦU (BOOKING)
        console.log("Booking deposit confirmed")
        await bookingService.confirmBookingDeposit(txnRef, vnp_Amount, vnp_Params["vnp_TransactionNo"]);
      }

      return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
      
    } catch (error) {
      if (error.message === "01") return res.status(200).json({ RspCode: "01", Message: "Order not found" });
      if (error.message === "02") return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
      if (error.message === "04") return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
      
      console.error("Lỗi IPN Webhook:", error);
      return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  } else {
    return res.status(200).json({ RspCode: "00", Message: "Transaction failed but noted" });
  }
};
// =====================================================================
// 2. LUỒNG RETURN URL: TRẢ VỀ FRONTEND (CHỈ ĐỂ HIỂN THỊ)
// =====================================================================
const vnpayReturn = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  
  const secretKey = process.env.VNP_HASH_SECRET;
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    const txnRef = vnp_Params["vnp_TxnRef"];
    const vnp_Amount = vnp_Params["vnp_Amount"] / 100;
    const responseCode = vnp_Params["vnp_ResponseCode"];
    if (responseCode === "00") {
      try {
        if (txnRef.startsWith("O_")) {
          const orderId = txnRef.split("O_")[1];
          await orderService.confirmOrderFinalPayment(orderId, vnp_Amount, vnp_Params["vnp_TransactionNo"]);
        } else if (txnRef.startsWith("ST_")) {
          const ticketId = txnRef.split("ST_")[1];
          await sharedMatchService.confirmSharedTicketPayment(ticketId, vnp_Amount);
        } else if (txnRef.startsWith("TP_")) {
          const participantId = txnRef.split("TP_")[1];
          await tournamentsService.confirmTournamentPayment(participantId, vnp_Amount, vnp_Params["vnp_TransactionNo"]);
        } else {
          await bookingService.confirmBookingDeposit(txnRef, vnp_Amount, vnp_Params["vnp_TransactionNo"]);
        }
      } catch (error) {
        if (error.message !== "02") {
          console.error("Lỗi xác nhận thanh toán từ Return URL:", error);
          return res.status(200).json({
            success: false,
            message: "Giao dịch thành công nhưng cập nhật trạng thái thất bại",
          });
        }
      }
      // Thành công -> Bắn ra giao diện Frontend báo Thành Công
      res.status(200).json({ success: true, message: "Giao dịch thành công!" });
    } else {
      // Thất bại -> Bắn ra giao diện Frontend báo Thất Bại
      res.status(200).json({ success: false, message: "Giao dịch thất bại / Bị hủy" });
    }
  } else {
    res.status(200).json({ success: false, message: "Chữ ký không hợp lệ, có thể bị hacker can thiệp" });
  }
};

module.exports = {
  vnpayIpn,
  vnpayReturn,
  getPaymentStatus,
};
