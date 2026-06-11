const Joi = require("joi");

const getDailyRevenue = {
  query: Joi.object({
    startDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        "string.pattern.base": "Định dạng startDate phải là YYYY-MM-DD",
        "any.required": "Vui lòng cung cấp startDate",
      }),
    endDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        "string.pattern.base": "Định dạng endDate phải là YYYY-MM-DD",
        "any.required": "Vui lòng cung cấp endDate",
      }),
    branch_id: Joi.string().hex().length(24).allow("", null).messages({
      "string.length": "branch_id không đúng định dạng ObjectId",
      "string.hex": "branch_id không đúng định dạng ObjectId",
    }),
  }),
};

const getDashboard = {
  query: Joi.object({
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .allow("", null)
      .messages({
        "string.pattern.base": "Định dạng date phải là YYYY-MM-DD",
      }),
    branch_id: Joi.string().hex().length(24).allow("", null).messages({
      "string.length": "branch_id không đúng định dạng ObjectId",
      "string.hex": "branch_id không đúng định dạng ObjectId",
    }),
  }),
};

const syncRevenue = {
  body: Joi.object({
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        "string.pattern.base": "Định dạng ngày phải là YYYY-MM-DD",
        "any.required": "Vui lòng cung cấp ngày cần đồng bộ (date)",
      }),
  }),
};

const getTransactions = {
  query: Joi.object({
    startDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        "string.pattern.base": "Định dạng startDate phải là YYYY-MM-DD",
        "any.required": "Vui lòng cung cấp startDate",
      }),
    endDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        "string.pattern.base": "Định dạng endDate phải là YYYY-MM-DD",
        "any.required": "Vui lòng cung cấp endDate",
      }),
    branch_id: Joi.string().hex().length(24).allow("", null).messages({
      "string.length": "branch_id không đúng định dạng ObjectId",
      "string.hex": "branch_id không đúng định dạng ObjectId",
    }),
    payment_method: Joi.string().valid("cash", "transfer", "vnpay", "momo").allow("", null).messages({
      "any.only": "payment_method không hợp lệ",
    }),
  }),
};

module.exports = {
  getDailyRevenue,
  getDashboard,
  syncRevenue,
  getTransactions,
};
