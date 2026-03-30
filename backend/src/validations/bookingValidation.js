const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const getBookingsValidation = {
  query: Joi.object({
    branch_id: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "branch_id là bắt buộc",
      "string.empty": "branch_id là bắt buộc",
      "string.pattern.base": "branch_id không hợp lệ",
    }),
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        "any.required": "date là bắt buộc",
        "string.empty": "date là bắt buộc",
        "string.pattern.base": "date phải có định dạng YYYY-MM-DD",
      }),
    court_id: Joi.string().pattern(objectIdRegex).optional().messages({
      "string.pattern.base": "court_id không hợp lệ",
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(100),
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
    start_time: Joi.date().iso().required().messages({
      "any.required": "start_time là bắt buộc",
      "date.format": "start_time phải là ISO date",
    }),
    end_time: Joi.date().iso().required().messages({
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
  }),
};

module.exports = {
  getBookingsValidation,
  holdBookingValidation,
};