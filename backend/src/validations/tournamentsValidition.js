const Joi = require("joi");

const createTournamentValidation = {
  body: Joi.object({
    name: Joi.string().min(3).max(255).required().messages({
      'string.base': 'Tên giải đấu phải là một chuỗi',
      'string.min': 'Tên giải đấu phải có ít nhất 3 ký tự',
      'string.max': 'Tên giải đấu không được dài quá 255 ký tự',
      'any.required': 'Tên giải đấu là bắt buộc',
    }),
    required_rank: Joi.string().valid("D", "C", "B", "A").required().messages({
      'string.base': 'Hạng yêu cầu phải là một chuỗi',
      'any.only': 'Hạng yêu cầu phải là một trong các giá trị: D, C, B, A',
      'any.required': 'Hạng yêu cầu là bắt buộc',
    }),
    max_participants: Joi.number().integer().min(2).required().messages({
      'number.base': 'Số lượng người tham gia phải là một số nguyên',
      'number.min': 'Số lượng người tham gia phải ít nhất là 2',
      'any.required': 'Số lượng người tham gia là bắt buộc',
    }),
    entry_fee: Joi.number().min(0).required().messages({
      'number.base': 'Lệ phí tham gia phải là một số',
      'number.min': 'Lệ phí tham gia phải không nhỏ hơn 0',
      'any.required': 'Lệ phí tham gia là bắt buộc',
    }),
    start_date: Joi.date().greater(Date.now()).required().messages({
      'date.base': 'Ngày bắt đầu phải là một ngày hợp lệ',
      'date.greater': 'Ngày bắt đầu phải sau thời điểm hiện tại',
      'any.required': 'Ngày bắt đầu là bắt buộc',
    }),
    end_date: Joi.date().greater(Joi.ref('start_date')).required().messages({
      'date.base': 'Ngày kết thúc phải là một ngày hợp lệ',
      'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu',
      'any.required': 'Ngày kết thúc là bắt buộc',
    }),
    branch_id: Joi.string().required().messages({
      'string.base': 'Chi nhánh là bắt buộc',
      'any.required': 'Chi nhánh (branch_id) là bắt buộc',
    }),
  }),
};

module.exports = createTournamentValidation;