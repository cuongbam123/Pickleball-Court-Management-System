const https = require("https");
const { format, toZonedTime } = require("date-fns-tz");
const mongoose = require("mongoose");

const Booking = require("../models/bookings");
const Order = require("../models/orders");
const SharedTicket = require("../models/sharedTicket");
const SharedMatch = require("../models/sharedMatch");
const Tournament = require("../models/tournaments");
const TournamentParticipant = require("../models/tournamentParticipants");

const TIMEZONE = "Asia/Ho_Chi_Minh";

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const formatTime = (date) => {
  if (!date) return "N/A";
  const zoned = toZonedTime(new Date(date), TIMEZONE);
  return format(zoned, "HH:mm", { timeZone: TIMEZONE });
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const zoned = toZonedTime(new Date(date), TIMEZONE);
  return format(zoned, "dd/MM/yyyy", { timeZone: TIMEZONE });
};

const formatDateTime = (date) => {
  if (!date) return "N/A";
  const zoned = toZonedTime(new Date(date), TIMEZONE);
  return format(zoned, "HH:mm:ss dd/MM/yyyy", { timeZone: TIMEZONE });
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const sendTelegramMessage = (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in .env");
    return;
  }

  const data = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  });

  const options = {
    hostname: "api.telegram.org",
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
    timeout: 5000,
  };

  const req = https.request(options, (res) => {
    let responseBody = "";
    res.on("data", (chunk) => {
      responseBody += chunk;
    });
    res.on("end", () => {
      if (res.statusCode !== 200) {
        console.error(
          `[Telegram] Failed to send message, status: ${res.statusCode}, response: ${responseBody}`
        );
      }
    });
  });

  req.on("error", (error) => {
    console.error("[Telegram] Error sending message:", error);
  });

  req.on("timeout", () => {
    req.destroy();
    console.error("[Telegram] Request timed out");
  });

  req.write(data);
  req.end();
};

const notifyDepositSuccess = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user_id")
      .populate("court_id")
      .populate("branch_id")
      .lean();

    if (!booking) {
      console.error(`[Telegram] Booking not found for notifyDepositSuccess: ${bookingId}`);
      return;
    }

    const message = `🎉 <b>ĐẶT CỌC SÂN THÀNH CÔNG</b>\n` +
      `👤 <b>Khách hàng:</b> ${escapeHTML(booking.user_id?.full_name)} | 📞 ${escapeHTML(booking.user_id?.phone || "N/A")}\n` +
      `🏟️ <b>Sân:</b> ${escapeHTML(booking.court_id?.name)} — ${escapeHTML(booking.branch_id?.name || "N/A")}\n` +
      `📅 <b>Thời gian:</b> ${formatTime(booking.start_time)} → ${formatTime(booking.end_time)}, ${formatDate(booking.start_time)}\n` +
      `💵 <b>Tiền cọc:</b> ${formatCurrency(booking.deposit_amount)}\n` +
      `🏦 <b>Phương thức:</b> VNPay\n` +
      `⏰ <b>Xác nhận lúc:</b> ${formatDateTime(new Date())}`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error("[Telegram] Error in notifyDepositSuccess:", error);
  }
};

const notifyFinalPaymentSuccess = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate("user_id")
      .populate("branch_id")
      .lean();

    if (!order) {
      console.error(`[Telegram] Order not found for notifyFinalPaymentSuccess: ${orderId}`);
      return;
    }

    let booking = null;
    if (order.booking_id) {
      booking = await Booking.findById(order.booking_id)
        .populate("court_id")
        .lean();
    }

    const message = `💰 <b>THANH TOÁN HOÀN TẤT</b>\n` +
      `👤 <b>Khách hàng:</b> ${escapeHTML(order.user_id?.full_name)} | 📞 ${escapeHTML(order.user_id?.phone || "N/A")}\n` +
      `🏟️ <b>Sân:</b> ${escapeHTML(booking?.court_id?.name || "N/A")} — ${escapeHTML(order.branch_id?.name || "N/A")}\n` +
      `📅 <b>Thời gian:</b> ${formatTime(booking?.start_time)} → ${formatTime(booking?.end_time)}, ${formatDate(booking?.start_time)}\n` +
      `💵 <b>Tổng tiền:</b> ${formatCurrency(order.total_court_fee)}\n` +
      `✅ <b>Đã cọc:</b> ${formatCurrency(order.deposit_paid)}\n` +
      `🔚 <b>Thanh toán thêm:</b> ${formatCurrency(order.final_amount_due)}\n` +
      `🏦 <b>Phương thức:</b> ${escapeHTML(order.payment_method || "vnpay").toUpperCase()}\n` +
      `⏰ <b>Hoàn tất lúc:</b> ${formatDateTime(new Date())}`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error("[Telegram] Error in notifyFinalPaymentSuccess:", error);
  }
};

const notifySharedTicketSuccess = async (sharedTicketId) => {
  try {
    const ticket = await SharedTicket.findById(sharedTicketId)
      .populate("user_id")
      .lean();

    if (!ticket) {
      console.error(`[Telegram] SharedTicket not found for notifySharedTicketSuccess: ${sharedTicketId}`);
      return;
    }

    let sharedMatch = null;
    let booking = null;
    if (ticket.shared_match_id) {
      sharedMatch = await SharedMatch.findById(ticket.shared_match_id).lean();
      if (sharedMatch && sharedMatch.booking_id) {
        booking = await Booking.findById(sharedMatch.booking_id)
          .populate("court_id")
          .populate("branch_id")
          .lean();
      }
    }

    const message = `🤝 <b>VÉ SÂN GHÉP THANH TOÁN THÀNH CÔNG</b>\n` +
      `👤 <b>Khách hàng:</b> ${escapeHTML(ticket.user_id?.full_name)} | 📞 ${escapeHTML(ticket.user_id?.phone || "N/A")}\n` +
      `🏟️ <b>Sân:</b> ${escapeHTML(booking?.court_id?.name || "N/A")} — ${escapeHTML(booking?.branch_id?.name || "N/A")}\n` +
      `📅 <b>Thời gian:</b> ${formatTime(booking?.start_time)} → ${formatTime(booking?.end_time)}, ${formatDate(booking?.start_time)}\n` +
      `💵 <b>Giá vé:</b> ${formatCurrency(ticket.ticket_price)}\n` +
      `👥 <b>Số slot đã đặt:</b> ${sharedMatch?.booked_slots || 0}/${sharedMatch?.max_slots || 0}\n` +
      `⏰ <b>Xác nhận lúc:</b> ${formatDateTime(new Date())}`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error("[Telegram] Error in notifySharedTicketSuccess:", error);
  }
};

const notifyTournamentPaymentSuccess = async (participantId) => {
  try {
    const participant = await TournamentParticipant.findById(participantId)
      .populate("user_id")
      .lean();

    if (!participant) {
      console.error(`[Telegram] TournamentParticipant not found for notifyTournamentPaymentSuccess: ${participantId}`);
      return;
    }

    let tournament = null;
    if (participant.tournament_id) {
      tournament = await Tournament.findById(participant.tournament_id)
        .populate("branch_id")
        .lean();
    }

    const message = `🏆 <b>ĐĂNG KÝ GIẢI ĐẤU THÀNH CÔNG</b>\n` +
      `👤 <b>Khách hàng:</b> ${escapeHTML(participant.user_id?.full_name)} | 📞 ${escapeHTML(participant.user_id?.phone || "N/A")}\n` +
      `🎯 <b>Giải đấu:</b> ${escapeHTML(tournament?.name || "N/A")}\n` +
      `🏟️ <b>Cơ sở:</b> ${escapeHTML(tournament?.branch_id?.name || "N/A")}\n` +
      `💵 <b>Lệ phí tham gia:</b> ${formatCurrency(tournament?.entry_fee)}\n` +
      `👥 <b>Số lượng tham gia hiện tại:</b> ${tournament?.current_participants || 0}/${tournament?.max_participants || 0}\n` +
      `⏰ <b>Xác nhận lúc:</b> ${formatDateTime(new Date())}`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error("[Telegram] Error in notifyTournamentPaymentSuccess:", error);
  }
};

const notifyPaymentFailed = async (txnRef, amount, failureReason) => {
  try {
    const message = `❌ <b>THANH TOÁN THẤT BẠI</b>\n` +
      `🔖 <b>Mã giao dịch (TxnRef):</b> <code>${escapeHTML(txnRef)}</code>\n` +
      `💵 <b>Số tiền:</b> ${formatCurrency(amount)}\n` +
      `⚠️ <b>Lý do:</b> ${escapeHTML(failureReason)}\n` +
      `⏰ <b>Thời gian:</b> ${formatDateTime(new Date())}`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error("[Telegram] Error in notifyPaymentFailed:", error);
  }
};

const notifyCancelBooking = async (booking, refundAction, reason) => {
  try {
    if (!booking) return;

    const bookingData = await Booking.findById(booking._id)
      .populate("user_id")
      .populate("court_id")
      .populate("branch_id")
      .lean();

    if (!bookingData) {
      console.error(`[Telegram] Booking not found for notifyCancelBooking: ${booking._id}`);
      return;
    }

    const refundText = refundAction?.is_refundable
      ? `${formatCurrency(refundAction.amount)} (${refundAction.percentage}%)`
      : "Không hoàn cọc";

    const message = `🚫 <b>HỦY ĐẶT SÂN</b>\n` +
      `👤 <b>Khách hàng:</b> ${escapeHTML(bookingData.user_id?.full_name)} | 📞 ${escapeHTML(bookingData.user_id?.phone || "N/A")}\n` +
      `🏟️ <b>Sân:</b> ${escapeHTML(bookingData.court_id?.name)} — ${escapeHTML(bookingData.branch_id?.name || "N/A")}\n` +
      `📅 <b>Thời gian:</b> ${formatTime(bookingData.start_time)} → ${formatTime(bookingData.end_time)}, ${formatDate(bookingData.start_time)}\n` +
      `💵 <b>Hoàn trả:</b> ${refundText}\n` +
      `💬 <b>Lý do:</b> ${escapeHTML(reason || "Không cung cấp")}\n` +
      `⏰ <b>Thời gian hủy:</b> ${formatDateTime(new Date())}`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error("[Telegram] Error in notifyCancelBooking:", error);
  }
};

module.exports = {
  notifyDepositSuccess,
  notifyFinalPaymentSuccess,
  notifySharedTicketSuccess,
  notifyTournamentPaymentSuccess,
  notifyPaymentFailed,
  notifyCancelBooking,
};
