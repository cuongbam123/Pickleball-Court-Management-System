const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const getBookingsValidation = {
  query: Joi.object({
    court_id: Joi.string().pattern(objectIdRegex).optional().messages({
      "string.pattern.base": "court_id không hợp lệ",
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(100),
  }),
};

const getBookingDetailValidation = {
  params: Joi.object({
    id: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "booking_id là bắt buộc trên URL",
      "string.empty": "booking_id không được để trống",
      "string.pattern.base": "booking_id không hợp lệ (Phải là chuẩn MongoDB ObjectId)",
    }),
  }),
};

const payDepositValidattion = {
  params: Joi.object({
    id: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "booking_id là bắt buộc trên URL",
      "string.empty": "booking_id không được để trống",
      "string.pattern.base": "booking_id không hợp lệ (Phải là chuẩn MongoDB ObjectId)",
    }),
  }),
  body: Joi.object({
    payment_method: Joi.string().valid('vnpay').required().messages({
      "any.required": "payment_method là bắt buộc",
      "any.only": "Hệ thống tạm thời chỉ hỗ trợ thanh toán qua 'vnpay'",
    }),
    redirect_url: Joi.string().uri().required().messages({
      "any.required": "redirect_url là bắt buộc để VNPay chuyển hướng về trang của bạn",
      "string.empty": "redirect_url không được để trống",
      "string.uri": "redirect_url phải là một đường dẫn URL hợp lệ",
    }),
  }),
};

const holdBookingValidation = {
  body: Joi.object({
    court_id: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "court_id là bắt buộc",
      "string.empty": "court_id là bắt buộc",
      "string.pattern.base": "court_id không hợp lệ",
    }),
    branch_id: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "branch_id là bắt buộc",
      "string.empty": "branch_id là bắt buộc",
      "string.pattern.base": "branch_id không hợp lệ",
    }),
    start_time: Joi.string().isoDate().required().messages({
      "any.required": "start_time là bắt buộc",
      "date.format": "start_time phải là ISO date",
    }),
    end_time: Joi.string().isoDate().required().messages({
      "any.required": "end_time là bắt buộc",
      "date.format": "end_time phải là ISO date",
    }),
    // Thêm validation cho buffer_time (thời gian đệm dọn sân)
    buffer_time: Joi.number().integer().min(0).max(60).default(10).messages({
      "number.base": "buffer_time phải là số",
      "number.min": "buffer_time không được nhỏ hơn 0",
      "number.max": "buffer_time không được vượt quá 60 phút",
    }),
    booking_type: Joi.string()
      .valid("standard", "shared_match")
      .default("standard"),
  }).custom((value, helpers) => {
    // Custom check so sánh 2 chuỗi ISO 
    if (value.start_time >= value.end_time) {
      return helpers.message("end_time phải lớn hơn start_time");
    }
    return value;
  }),
};

const updateBookingStatusValidation = {
  body: Joi.object({
    status: Joi.string()
      .valid("playing", "completed")
      .required()
      .messages({
        "any.required": "Trạng thái (status) là bắt buộc",
        "any.only": "Trạng thái chỉ chấp nhận giá trị 'playing' hoặc 'completed'",
      }),
  }),
  params: Joi.object({
    id: Joi.string().pattern(objectIdRegex).required().messages({
      "string.pattern.base": "booking_id không hợp lệ",
    }),
  }),
};

const cancelBookingValidation = {
  body: Joi.object({
    reason: Joi.string().trim().required().messages({
      "any.required": "Lý do hủy là bắt buộc",
      "string.empty": "Lý do hủy không được để trống",
    }),
    cancelled_by: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "cancelled_by (người hủy) là bắt buộc",
      "string.empty": "cancelled_by (người hủy) không được để trống",
      "string.pattern.base": "cancelled_by phải là một ObjectId hợp lệ",
    }),
  }),
  params: Joi.object({
    id: Joi.string().pattern(objectIdRegex).required().messages({
      "string.pattern.base": "booking_id không hợp lệ",
    }),
  }),
};

module.exports = {
  getBookingsValidation,
  holdBookingValidation,
  getBookingDetailValidation,
  payDepositValidattion,
  updateBookingStatusValidation,
  cancelBookingValidation,
};