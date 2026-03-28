const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    
    if (err.name === "JsonWebTokenError") {
        error = new AppError("Token không hợp lệ. Vui lòng đăng nhập lại.", 401);
    }
    if (err.name === "TokenExpiredError") {
        error = new AppError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
    }
    if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
        error = new AppError(`Dữ liệu '${field}' đã tồn tại. Vui lòng dùng giá trị khác.`, 400);
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: error.message || "Lỗi hệ thống (Internal Server Error)",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
module.exports = errorHandler;