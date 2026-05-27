const crypto = require("crypto");
const querystring = require("qs");
const bookingService = require("../services/bookingService");
const orderService = require("../services/orderService");
const sharedMatchService = require("../services/sharedMatchService");

function sortObject(obj) {
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
}

const confirmVnpayTransaction = async (txnRef, vnpAmount) => {
  if (txnRef.startsWith("O_")) {
    const orderId = txnRef.split("O_")[1];
    await orderService.confirmOrderFinalPayment(orderId, vnpAmount);
    return;
  }

  if (txnRef.startsWith("ST_")) {
    const ticketId = txnRef.split("ST_")[1];
    await sharedMatchService.confirmSharedTicketPayment(ticketId, vnpAmount);
    return;
  }

  await bookingService.confirmBookingDeposit(txnRef, vnpAmount);
};

const vnpayIpn = async (req, res) => {
  let vnpParams = req.query;
  const secureHash = vnpParams["vnp_SecureHash"];

  delete vnpParams["vnp_SecureHash"];
  delete vnpParams["vnp_SecureHashType"];

  vnpParams = sortObject(vnpParams);

  const secretKey = process.env.VNP_HASH_SECRET;
  const signData = querystring.stringify(vnpParams, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash !== signed) {
    return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }

  const txnRef = vnpParams["vnp_TxnRef"];
  const vnpAmount = vnpParams["vnp_Amount"] / 100;
  const responseCode = vnpParams["vnp_ResponseCode"];

  if (responseCode === "00") {
    try {
      await confirmVnpayTransaction(txnRef, vnpAmount);

      return res
        .status(200)
        .json({ RspCode: "00", Message: "Confirm Success" });
    } catch (error) {
      if (error.message === "01") {
        return res
          .status(200)
          .json({ RspCode: "01", Message: "Order not found" });
      }
      if (error.message === "02") {
        return res
          .status(200)
          .json({ RspCode: "02", Message: "Order already confirmed" });
      }
      if (error.message === "04") {
        return res
          .status(200)
          .json({ RspCode: "04", Message: "Invalid amount" });
      }

      console.error("Lỗi IPN Webhook:", error);
      return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  }

  return res
    .status(200)
    .json({ RspCode: "00", Message: "Transaction failed but noted" });
};

const vnpayReturn = async (req, res) => {
  let vnpParams = req.query;
  const secureHash = vnpParams["vnp_SecureHash"];

  delete vnpParams["vnp_SecureHash"];
  delete vnpParams["vnp_SecureHashType"];

  vnpParams = sortObject(vnpParams);

  const secretKey = process.env.VNP_HASH_SECRET;
  const signData = querystring.stringify(vnpParams, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash !== signed) {
    return res.status(200).json({
      success: false,
      message: "Chữ ký không hợp lệ",
    });
  }

  const txnRef = vnpParams["vnp_TxnRef"];
  const vnpAmount = vnpParams["vnp_Amount"] / 100;
  const responseCode = vnpParams["vnp_ResponseCode"];

  if (responseCode !== "00") {
    return res.status(200).json({
      success: false,
      message: "Giao dịch thất bại / bị hủy",
    });
  }

  if (txnRef.startsWith("ST_")) {
    try {
      const ticketId = txnRef.split("ST_")[1];
      await sharedMatchService.confirmSharedTicketPayment(ticketId, vnpAmount);
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán vé ghép từ Return URL:", error);
      return res.status(200).json({
        success: false,
        message: "Giao dịch thành công nhưng cập nhật trạng thái thất bại",
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Giao dịch thành công!",
  });
};

module.exports = {
  vnpayIpn,
  vnpayReturn,
};
