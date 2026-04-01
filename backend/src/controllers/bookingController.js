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

module.exports = {
  getBookings,
  holdBooking,
};