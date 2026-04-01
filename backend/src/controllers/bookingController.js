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

    const cancelledBooking = await bookingService.cancelBooking(id, reason, user);

    return res.status(200).json({
      success: true,
      message: "Hủy đặt sân thành công",
      data: {
        _id: cancelledBooking._id,
        status: cancelledBooking.status,
        cancel_at: cancelledBooking.cancel_at,
        refund_status: cancelledBooking.refund_status,
        deposit_amount: cancelledBooking.deposit_amount
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  holdBooking,
  updateBookingStatus,
  cancelBooking,

};