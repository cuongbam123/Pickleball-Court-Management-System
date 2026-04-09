const crypto = require("crypto");
const querystring = require("qs");
const bookingService = require("../services/bookingService");
const orderService = require("../services/orderService"); 
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
        const orderId = txnRef.split("O_")[1]; // Cắt bỏ chữ O_ để lấy ID thật
        await orderService.confirmOrderFinalPayment(orderId, vnp_Amount);
      } else {
        // 2. THANH TOÁN CỌC BAN ĐẦU (BOOKING)
        await bookingService.confirmBookingDeposit(txnRef, vnp_Amount);
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
const vnpayReturn = (req, res) => {
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
    const responseCode = vnp_Params["vnp_ResponseCode"];
    if (responseCode === "00") {
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
  vnpayReturn
};