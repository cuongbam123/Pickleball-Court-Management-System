const mongoose = require("mongoose");
const crypto = require("crypto");
const querystring = require("qs");
const { parse, addMinutes } = require("date-fns");
const { formatInTimeZone } = require("date-fns-tz");

const Court = require("../models/court");
const Order = require("../models/orders");
const Booking = require("../models/bookings");
const Product = require("../models/products");
const AuditLog = require("../models/audit_logs");
const PaymentTransaction = require("../models/payment_transactions");
const { buildVnpayUrl } = require("../utils/vnpayHelper");
const { emitBookingChange } = require("../config/socket");

const TIME_ZONE = "Asia/Ho_Chi_Minh";

const getIdString = (value) => {
  if (!value) return null;
  return (value._id || value.id || value).toString();
};

const assertCanAccessOrder = (order, user, { allowCustomer = false } = {}) => {
  if (!user) {
    const error = new Error("Bạn cần đăng nhập để thao tác hóa đơn");
    error.status = 401;
    throw error;
  }

  if (user.role === "admin") return;

  if (user.role === "staff") {
    const staffBranchId = getIdString(user.branch_id);
    const orderBranchId = getIdString(order.branch_id);

    if (staffBranchId && orderBranchId === staffBranchId) return;

    const error = new Error("Bạn không có quyền thao tác hóa đơn của chi nhánh khác");
    error.status = 403;
    throw error;
  }

  if (allowCustomer) {
    const currentUserId = getIdString(user.userId || user._id || user.id);
    const orderUserId = getIdString(order.user_id);

    if (currentUserId && orderUserId === currentUserId) return;
  }

  const error = new Error("Bạn không có quyền thao tác hóa đơn này");
  error.status = 403;
  throw error;
};

const getOrders = async (query, user) => {
  const { branch_id, date, payment_status, booking_id, page = 1, limit = 20 } = query;
  const filter = { is_deleted: false };

  if (user.role === "staff") {
    filter.branch_id = user.branch_id;
  } else if (user.role === "admin" && branch_id) {
    filter.branch_id = branch_id;
  }

  if (booking_id) {
    filter.booking_id = booking_id;
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

const ensureOrderForBooking = async (bookingId, user) => {
  const existingOrder = await Order.findOne({
    booking_id: bookingId,
    is_deleted: false,
  });

  if (existingOrder) {
    assertCanAccessOrder(existingOrder, user);
    return existingOrder;
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    is_deleted: false,
  }).lean();

  if (!booking) {
    const error = new Error("Không tìm thấy thông tin đặt sân");
    error.status = 404;
    throw error;
  }

  assertCanAccessOrder(
    {
      user_id: booking.user_id,
      branch_id: booking.branch_id,
    },
    user,
  );

  if (!["deposited", "playing"].includes(booking.status)) {
    const error = new Error(
      "Chỉ có thể tạo hóa đơn cho lịch đã cọc hoặc đang chơi",
    );
    error.status = 400;
    throw error;
  }

  const depositPaid = Number(booking.deposit_amount || 0);
  const totalCourtFee = Number(booking.total_court_price || 0);

  try {
    return await Order.create({
      booking_id: booking._id,
      user_id: booking.user_id,
      branch_id: booking.branch_id,
      total_court_fee: totalCourtFee,
      total_pos_fee: 0,
      deposit_paid: depositPaid,
      final_amount_due: Math.max(totalCourtFee - depositPaid, 0),
      payment_status: "deposit_paid",
      is_temporary: false,
    });
  } catch (error) {
    if (error.code === 11000) {
      const order = await Order.findOne({
        booking_id: bookingId,
        is_deleted: false,
      });

      if (order) {
        assertCanAccessOrder(order, user);
        return order;
      }
    }

    throw error;
  }
};

const getOrderDetail = async (orderId, user) => {
  const order = await Order.findById(orderId)
    .populate("user_id", "full_name phone")
    .populate("booking_id", "start_time end_time status")
    .lean();

  if (!order || order.is_deleted) throw new Error("Hóa đơn không tồn tại");

  assertCanAccessOrder(order, user, { allowCustomer: true });

  return order;
};

const createDepositPaymentUrl = async (orderId, body, req, user) => {
  const { payment_method, redirect_url } = body;

  if (payment_method !== "vnpay") throw new Error("Hệ thống tạm thời chỉ hỗ trợ VNPay");

  const order = await Order.findById(orderId);
  if (!order || order.is_deleted) throw new Error("Hóa đơn không tồn tại");

  assertCanAccessOrder(order, user, { allowCustomer: true });

  if (order.payment_status === "fully_paid") {
    throw new Error("Hóa đơn này đã được thanh toán hoàn tất");
  }
  if (order.final_amount_due <= 0) {
    throw new Error("Hóa đơn không có dư nợ để thanh toán");
  }

  let ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  if (ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1") ipAddr = "127.0.0.1";

  const txnRef = `O_${order._id.toString()}`;

  const vnpayRes = buildVnpayUrl({
    txnRef,
    amount: order.final_amount_due,
    orderInfo: `Thanh toan tong hoa don ${order._id}`,
    ipAddr,
    returnUrl: redirect_url,
    expireMinutes: 10,
  });

  // Tạo hoặc cập nhật giao dịch PaymentTransaction
  await PaymentTransaction.findOneAndUpdate(
    { reference_type: "Order", reference_id: order._id },
    {
      amount: order.final_amount_due,
      payment_method: "vnpay",
      status: "pending",
      expires_at: vnpayRes.expires_at,
    },
    { upsert: true, new: true }
  );

  return {
    payment_url: vnpayRes.payment_url,
    expires_at: vnpayRes.expires_at,
  };
};

const confirmOrderFinalPayment = async (orderId, vnp_Amount, transactionNo = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("01");

    if (order.final_amount_due !== vnp_Amount) throw new Error("04");
    
    if (order.payment_status === "fully_paid") throw new Error("02"); 

    // Cập nhật giao dịch PaymentTransaction sang paid
    const transaction = await PaymentTransaction.findOne({
      reference_type: "Order",
      reference_id: orderId,
    }).session(session);

    if (transaction) {
      transaction.status = "paid";
      if (transactionNo) {
        transaction.webhook_transaction_id = transactionNo;
      }
      await transaction.save({ session });
    }

    order.payment_status = "fully_paid";
    order.payment_method = "vnpay";
    await order.save({ session });

    const booking = await Booking.findById(order.booking_id).session(session);
    if (booking) {
      booking.status = "completed";
      await booking.save({ session });
    }

    const court = await Court.findById(booking.court_id).session(session);
    if (court) {
      court.tagStatus = "available";
      await court.save({ session });
    }
    await session.commitTransaction();

    await AuditLog.create({
      action: "confirm_order_final_payment",
      user_id: order.user_id,
      target_collection: "orders",
      target_id: order._id,
      old_value: {
        payment_status: "pending_final",
        payment_method: null,
      },
      new_value: {
        payment_status: "fully_paid",
        payment_method: "vnpay",
      },
    });

    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const checkoutOrder = async (orderId, payment_method, amount_received, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy hóa đơn");
    assertCanAccessOrder(order, user);

    if (order.payment_status === "fully_paid") {
      throw new Error("Hóa đơn này đã được thanh toán hoàn tất trước đó");
    }

    if (amount_received < order.final_amount_due) {
      throw new Error(
        `Số tiền nhận (${amount_received}đ) không đủ để thanh toán nợ (${order.final_amount_due}đ)`,
      );
    }

    // Ghi nhận PaymentTransaction cho hóa đơn checkout trực tiếp (tiền mặt / chuyển khoản)
    await PaymentTransaction.create(
      [
        {
          reference_type: "Order",
          reference_id: orderId,
          amount: order.final_amount_due,
          payment_method: payment_method,
          status: "paid",
          expires_at: new Date(),
        },
      ],
      { session }
    );

    order.payment_status = "fully_paid";
    order.payment_method = payment_method;

    await order.save({ session });

    const booking = await Booking.findById(order.booking_id).session(session);
    if (booking) {
      booking.status = "completed";
      await booking.save({ session });
    }

    await session.commitTransaction();

    await AuditLog.create({
      action: "checkout_order",
      user_id: order.user_id,
      target_collection: "orders",
      target_id: order._id,
      old_value: {
        payment_status: order.payment_status,
        payment_method: order.payment_method,
      },
      new_value: {
        payment_status: "fully_paid",
        payment_method,
      },
    });

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const addPosItemsToOrder = async (orderId, items, user) => {
  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy hóa đơn");
    assertCanAccessOrder(order, user);
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

const updatePosItemQuantity = async (orderId, productId, newQuantity, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error("Không tìm thấy hóa đơn");
    assertCanAccessOrder(order, user);
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
  ensureOrderForBooking,
  getOrderDetail,
  createDepositPaymentUrl,
  checkoutOrder,
  addPosItemsToOrder,
  updatePosItemQuantity,
  confirmOrderFinalPayment,
};
