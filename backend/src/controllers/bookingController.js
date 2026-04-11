const bookingService = require("../services/bookingService");

const getBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getBookings(req.query, req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đặt sân thành công",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getBookingDetail = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const result = await bookingService.getBookingDetail(bookingId, req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết đặt sân thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createDepositPaymentUrl = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const body = req.body;
    const user = req.user;
    const result = await bookingService.createDepositPaymentUrl(
      bookingId,
      body,
      req,
      user,
    );
    return res.status(200).json({
      success: true,
      message: "Tạo URL thanh toán cọc thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const holdBooking = async (req, res, next) => {
  try {
    const result = await bookingService.holdBooking(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: "Giữ chỗ thành công. Vui lòng thanh toán tiền cọc trong vòng 10 phút để xác nhận lịch.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user; 

    const updatedBooking = await bookingService.updateBookingStatus(id, status, user);
    const message = status === "playing" ? "Check-in sân thành công" : "Cập nhật hoàn thành sân thành công";

    return res.status(200).json({
      success: true,
      message: message,
      data: {
        _id: updatedBooking._id,
        status: updatedBooking.status,
        updated_at: updatedBooking.updatedAt 
      },
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; 
    const user = req.user;

    const result = await bookingService.cancelBooking(id, reason, user);

    return res.status(200).json({
      success: true,
      message: "Hủy đặt sân thành công",
      data: {
        _id: result._id,
        status: result.status,
        cancel_at: result.cancel_at,
        refund_status: result.refund_status,
        deposit_amount: result.deposit_amount,
        refund_action: result.refund_action,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  holdBooking,
  getBookingDetail,
  updateBookingStatus,
  cancelBooking,
  createDepositPaymentUrl,

};