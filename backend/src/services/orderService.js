const mongoose = require("mongoose");
const crypto = require("crypto");
const querystring = require("qs");
const { parse, addMinutes } = require("date-fns");
const { formatInTimeZone } = require("date-fns-tz");

const Order = require("../models/orders");
const Booking = require("../models/bookings");
const Product = require("../models/products");

const TIME_ZONE = "Asia/Ho_Chi_Minh";

const getOrders = async (query, user) => {
  const { branch_id, date, payment_status, page = 1, limit = 20 } = query;
  const filter = { is_deleted: false };

  if (user.role === "staff") {
    filter.branch_id = user.branch_id;
  } else if (user.role === "admin" && branch_id) {
    filter.branch_id = branch_id;
  }

  if (date) {
    const normalizedDateStr = date.replace(/\//g, "-");
    const parsedDate = parse(normalizedDateStr, "dd-MM-yyyy", new Date());

    const startOfDayHCM = new Date(
      formatInTimeZone(parsedDate, TIME_ZONE, "yyyy-MM-dd'T'00:00:00+07:00"),
    );
    const endOfDayHCM = new Date(
      formatInTimeZone(
        parsedDate,
        TIME_ZONE,
        "yyyy-MM-dd'T'23:59:59.999+07:00",
      ),
    );

    filter.createdAt = { $gte: startOfDayHCM, $lte: endOfDayHCM };
  }

  if (payment_status) {
    filter.payment_status = { $in: payment_status.split(",") };
  }

  const skip = (page - 1) * limit;

  const [orders, total_records] = await Promise.all([
    Order.find(filter)
      .populate("user_id", "full_name phone")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total_records,
      total_pages: Math.ceil(total_records / limit),
    },
  };
};

const getOrderDetail = async (orderId, user) => {
  const order = await Order.findById(orderId)
    .populate("user_id", "full_name phone")
    .populate("booking_id", "start_time end_time status")
    .lean();

  if (!order || order.is_deleted) throw new Error("Hóa đơn không tồn tại");

  if (
    user.role === "customer" &&
    order.user_id._id.toString() !== user._id.toString()
  ) {
    throw new Error("Bạn không có quyền xem hóa đơn này");
  }

  return order;
};

const createDepositPaymentUrl = async (orderId, body, req, user) => {
  const { payment_method, redirect_url } = body;

  if (payment_method !== "vnpay") throw new Error("Hệ thống tạm thời chỉ hỗ trợ VNPay");

  const order = await Order.findById(orderId);
  if (!order || order.is_deleted) throw new Error("Hóa đơn không tồn tại");

  const currentUserId = user.userId || user._id || user.id;
  if (user.role === "customer" && order.user_id.toString() !== currentUserId.toString()) {
    throw new Error("Bạn không có quyền thanh toán cho hóa đơn này");
  }

  if (order.payment_status === "fully_paid") {
    throw new Error("Hóa đơn này đã được thanh toán hoàn tất");
  }
  if (order.final_amount_due <= 0) {
    throw new Error("Hóa đơn không có dư nợ để thanh toán");
  }

  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL;
  
  let ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  if (ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1") ipAddr = "127.0.0.1";

  const now = new Date();
  const createDate = formatInTimeZone(now, TIME_ZONE, "yyyyMMddHHmmss");
  const expireDate = formatInTimeZone(addMinutes(now, 10), TIME_ZONE, "yyyyMMddHHmmss");

  const amount = Math.round(order.final_amount_due * 100); 

  const txnRef = `O_${order._id.toString()}`;

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef, 
    vnp_OrderInfo: `Thanh toan tong hoa don ${order._id}`,
    vnp_OrderType: "billpayment",
    vnp_Amount: amount,
    vnp_ReturnUrl: redirect_url,
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
    expires_at: addMinutes(now, 10),
  };
};

const confirmOrderFinalPayment = async (orderId, vnp_Amount) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("01");

    if (order.final_amount_due !== vnp_Amount) throw new Error("04");
    
    if (order.payment_status === "fully_paid") throw new Error("02"); 

    order.payment_status = "fully_paid";
    order.payment_method = "vnpay";
    await order.save({ session });


    const booking = await Booking.findById(order.booking_id).session(session);
    if (booking) {
      booking.status = "completed";
      await booking.save({ session });
    }

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const checkoutOrder = async (orderId, payment_method, amount_received) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy hóa đơn");

    if (order.payment_status === "fully_paid") {
      throw new Error("Hóa đơn này đã được thanh toán hoàn tất trước đó");
    }

    if (amount_received < order.final_amount_due) {
      throw new Error(
        `Số tiền nhận (${amount_received}đ) không đủ để thanh toán nợ (${order.final_amount_due}đ)`,
      );
    }

    order.payment_status = "fully_paid";
    order.payment_method = payment_method;

    await order.save({ session });

    const booking = await Booking.findById(order.booking_id).session(session);
    if (booking) {
      booking.status = "completed";
      await booking.save({ session });
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const addPosItemsToOrder = async (orderId, items) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy hóa đơn");
    if (order.payment_status === "fully_paid")
      throw new Error("Hóa đơn đã chốt sổ, không thể thêm đồ POS");

    let additionalPosFee = 0;
    const orderItemsSnapshot = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id).session(session);

      if (!product)
        throw new Error(`Sản phẩm với ID ${item.product_id} không tồn tại`);
      if (product.stock < item.quantity)
        throw new Error(`Sản phẩm ${product.name} không đủ tồn kho`);

      product.stock -= item.quantity;
      await product.save({ session });

      orderItemsSnapshot.push({
        product_id: product._id,
        name_snapshot: product.name,
        unit_price_snapshot: product.price,
        quantity: item.quantity,
      });

      additionalPosFee += product.price * item.quantity;
    }

    order.order_items.push(...orderItemsSnapshot);
    order.total_pos_fee += additionalPosFee;
    order.final_amount_due =
      order.total_court_fee + order.total_pos_fee - order.deposit_paid;

    if (order.payment_status === "deposit_paid") {
      order.payment_status = "pending_final";
    }

    await order.save({ session });
    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const updatePosItemQuantity = async (orderId, productId, newQuantity) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy hóa đơn");
    if (order.payment_status === "fully_paid")
      throw new Error("Hóa đơn đã chốt sổ, không thể sửa đổi");

    const itemIndex = order.order_items.findIndex(
      (item) => item.product_id.toString() === productId,
    );

    if (itemIndex === -1)
      throw new Error("Món hàng này không tồn tại trong hóa đơn");

    const currentItem = order.order_items[itemIndex];
    const oldQuantity = currentItem.quantity;

    const diff = newQuantity - oldQuantity;

    if (diff === 0) {
      await session.abortTransaction();
      return order;
    }

    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Sản phẩm không tồn tại trong kho");

    if (diff > 0 && product.stock < diff) {
      throw new Error(`Kho không đủ. Chỉ còn ${product.stock} sản phẩm`);
    }

    product.stock -= diff;
    await product.save({ session });

    const amountDifference = diff * currentItem.unit_price_snapshot;
    order.total_pos_fee += amountDifference;

    if (newQuantity === 0) {
      order.order_items.splice(itemIndex, 1);
    } else {
      order.order_items[itemIndex].quantity = newQuantity;
    }

    order.final_amount_due =
      order.total_court_fee + order.total_pos_fee - order.deposit_paid;

    if (
      order.final_amount_due === 0 &&
      order.payment_status === "pending_final"
    ) {
      order.payment_status = "deposit_paid";
    }

    await order.save({ session });
    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
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

module.exports = {
  getOrders,
  getOrderDetail,
  createDepositPaymentUrl,
  checkoutOrder,
  addPosItemsToOrder,
  updatePosItemQuantity,
  confirmOrderFinalPayment,
};
