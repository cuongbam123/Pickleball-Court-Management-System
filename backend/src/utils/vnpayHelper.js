const crypto = require("crypto");
const querystring = require("qs");
const { formatInTimeZone } = require("date-fns-tz");
const { addMinutes } = require("date-fns");

const TIME_ZONE = "Asia/Ho_Chi_Minh";

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

const buildVnpayUrl = ({ txnRef, amount, orderInfo, ipAddr, returnUrl, expireMinutes = 10 }) => {
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL;

  const now = new Date();
  const createDate = formatInTimeZone(now, TIME_ZONE, "yyyyMMddHHmmss");
  const expireDate = formatInTimeZone(addMinutes(now, expireMinutes), TIME_ZONE, "yyyyMMddHHmmss");

  const vnpAmount = Math.round(amount * 100);

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "billpayment",
    vnp_Amount: vnpAmount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  vnp_Params = sortObject(vnp_Params);
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: false });

  return {
    payment_url: paymentUrl,
    expires_at: addMinutes(now, expireMinutes),
  };
};

module.exports = {
  sortObject,
  verifySignedReturnParams,
  buildVnpayUrl,
};
