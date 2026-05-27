const joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const sharedMatchCreateValidation = {
  body: joi.object({
    court_id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "court_id phải là một chuỗi",
      "string.pattern.base": "court_id phải là ObjectId hợp lệ",
      "any.required": "court_id là bắt buộc",
    }),
    branch_id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "branch_id phải là một chuỗi",
      "string.pattern.base": "branch_id phải là ObjectId hợp lệ",
      "any.required": "branch_id là bắt buộc",
    }),
    start_time: joi.date().greater("now").required().messages({
      "date.base": "start_time phải là một ngày hợp lệ",
      "date.greater": "start_time phải là một ngày trong tương lai",
      "any.required": "start_time là bắt buộc",
    }),
    end_time: joi.date().greater(joi.ref("start_time")).required().messages({
      "date.base": "end_time phải là một ngày hợp lệ",
      "date.greater": "end_time phải sau start_time",
      "any.required": "end_time là bắt buộc",
    }),
    ticket_price: joi.number().min(0).required().messages({
      "number.base": "ticket_price phải là một số",
      "number.min": "ticket_price phải lớn hơn hoặc bằng 0",
      "any.required": "ticket_price là bắt buộc",
    }),
    max_slots: joi.number().integer().min(2).required().messages({
      "number.base": "max_slots phải là một số nguyên",
      "number.integer": "max_slots phải là một số nguyên",
      "number.min": "max_slots phải lớn hơn hoặc bằng 2",
      "any.required": "max_slots là bắt buộc",
    }),
  }),
};

const getSharedMatchesValidation = {
  query: joi.object({
    page: joi.number().integer().min(1).default(1).messages({
      "number.base": "page phải là một số",
      "number.integer": "page phải là một số nguyên",
      "number.min": "page phải lớn hơn hoặc bằng 1",
    }),
    limit: joi.number().integer().min(1).max(100).default(10).messages({
      "number.base": "limit phải là một số",
      "number.integer": "limit phải là một số nguyên",
      "number.min": "limit phải lớn hơn hoặc bằng 1",
      "number.max": "limit phải nhỏ hơn hoặc bằng 100",
    }),
    search: joi.string().trim().allow("", null),
    branch_id: joi.string().pattern(objectIdRegex).messages({
      "string.pattern.base": "branch_id phải là ObjectId hợp lệ",
    }),
    status: joi.string().valid("recruiting", "locked", "completed", "cancelled"),
  }),
};

const getSharedMatchByIdValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "id phải là một chuỗi",
      "string.pattern.base": "id phải là ObjectId hợp lệ",
      "any.required": "id là bắt buộc",
    }),
  }),
};

const updateSharedMatchValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "id phải là một chuỗi",
      "string.pattern.base": "id phải là ObjectId hợp lệ",
      "any.required": "id là bắt buộc",
    }),
  }),
  body: joi.object({
    ticket_price: joi.number().min(0).messages({
      "number.base": "ticket_price phải là một số",
      "number.min": "ticket_price phải lớn hơn hoặc bằng 0",
    }),
    max_slots: joi.number().integer().min(2).messages({
      "number.base": "max_slots phải là một số nguyên",
      "number.integer": "max_slots phải là một số nguyên",
      "number.min": "max_slots phải lớn hơn hoặc bằng 2",
    }),
  }).or("ticket_price", "max_slots").messages({
    "object.missing": "Phải cung cấp ít nhất một trường để cập nhật (ticket_price, max_slots)",
  }),
};

const updateSharedMatchStatusValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "id phải là một chuỗi",
      "string.pattern.base": "id phải là ObjectId hợp lệ",
      "any.required": "id là bắt buộc",
    }),
  }),
  body: joi.object({
    status: joi.string().valid("locked", "completed", "cancelled").required().messages({
      "string.base": "status phải là một chuỗi",
      "any.only": "status chỉ chấp nhận: locked, completed, cancelled",
      "any.required": "status là bắt buộc",
    }),
  }),
};

const joinSharedMatchValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "id phải là một chuỗi",
      "string.pattern.base": "id phải là ObjectId hợp lệ",
      "any.required": "id là bắt buộc",
    }),
  }),
};

const confirmSharedTicketPaymentValidation = {
  params: joi.object({
    ticket_id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "ticket_id phải là một chuỗi",
      "string.pattern.base": "ticket_id phải là ObjectId hợp lệ",
      "any.required": "ticket_id là bắt buộc",
    }),
  }),
  body: joi.object({
    paid_amount: joi.number().min(0).required().messages({
      "number.base": "paid_amount phải là một số",
      "number.min": "paid_amount phải lớn hơn hoặc bằng 0",
      "any.required": "paid_amount là bắt buộc",
    }),
  }),
};

const buySharedMatchTicketValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "id phải là một chuỗi",
      "string.pattern.base": "id phải là ObjectId hợp lệ",
      "any.required": "id là bắt buộc",
    }),
  }),
  body: joi.object({
    payment_method: joi.string().valid("vnpay").required().messages({
      "any.required": "payment_method là bắt buộc",
      "any.only": "Hệ thống chỉ hỗ trợ thanh toán qua vnpay",
    }),
    redirect_url: joi.string().uri().required().messages({
      "any.required": "redirect_url là bắt buộc",
      "string.uri": "redirect_url phải là URL hợp lệ",
    }),
  }),
};

const getSharedMatchTicketValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdRegex).required().messages({
      "string.base": "id phải là một chuỗi",
      "string.pattern.base": "id phải là ObjectId hợp lệ",
      "any.required": "id là bắt buộc",
    }),
  }),
};
const cancelSharedTicketValidation = {
  params: joi.object({
    ticket_id: joi.string().pattern(objectIdRegex).required().messages({
      "string.pattern.base": "ticket_id phải là ObjectId hợp lệ",
      "any.required": "ticket_id là bắt buộc",
    }),
  }),
};
module.exports = {
  sharedMatchCreateValidation,
  getSharedMatchesValidation,
  getSharedMatchByIdValidation,
  updateSharedMatchValidation,
  updateSharedMatchStatusValidation,
  joinSharedMatchValidation,
  confirmSharedTicketPaymentValidation,
  buySharedMatchTicketValidation,
  getSharedMatchTicketValidation,
  cancelSharedTicketValidation,
};