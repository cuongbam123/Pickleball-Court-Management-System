const orderService = require("../services/orderService");

const getOrders = async (req, res, next) => {
  try {
    const query = req.query;
    const user = req.user;

    const result = await orderService.getOrders(query, user);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách hóa đơn thành công",
      data: result.orders,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const user = req.user;

    const order = await orderService.getOrderDetail(orderId, user);

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết hóa đơn thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const payDeposit = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const body = req.body;
    const user = req.user;

    const result = await orderService.createDepositPaymentUrl(
      bookingId,
      body,
      req,
      user,
    );

    res.status(200).json({
      success: true,
      message: "Tạo URL thanh toán cọc thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const addPosItems = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const items = req.body.items;

    const updatedOrder = await orderService.addPosItemsToOrder(orderId, items, req.user);

    res.status(200).json({
      success: true,
      message: "Thêm sản phẩm POS vào hóa đơn thành công",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const updatePosItem = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { product_id, quantity } = req.body;

    const updatedOrder = await orderService.updatePosItemQuantity(
      orderId,
      product_id,
      quantity,
      req.user,
    );

    res.status(200).json({
      success: true,
      message:
        quantity === 0
          ? "Đã xóa sản phẩm khỏi hóa đơn"
          : "Cập nhật số lượng thành công",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const checkout = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { payment_method, amount_received } = req.body;

    const updatedOrder = await orderService.checkoutOrder(
      orderId,
      payment_method,
      amount_received,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Thanh toan hoa don hoan tat",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderDetail,
  payDeposit,
  addPosItems,
  updatePosItem,
  checkout,
};
