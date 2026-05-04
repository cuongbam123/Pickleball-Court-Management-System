const Joi = require("joi");

const createTournamentValidation = {
  body: Joi.object({
    name: Joi.string().min(3).max(255).required().messages({
      "string.base": "Ten giai dau phai la mot chuoi",
      "string.min": "Ten giai dau phai co it nhat 3 ky tu",
      "string.max": "Ten giai dau khong duoc dai qua 255 ky tu",
      "any.required": "Ten giai dau la bat buoc",
    }),
    required_rank: Joi.string().valid("D", "C", "B", "A").required().messages({
      "string.base": "Hang yeu cau phai la mot chuoi",
      "any.only": "Hang yeu cau phai la mot trong cac gia tri: D, C, B, A",
      "any.required": "Hang yeu cau la bat buoc",
    }),
    max_participants: Joi.number().integer().min(2).required().messages({
      "number.base": "So luong nguoi tham gia phai la mot so nguyen",
      "number.min": "So luong nguoi tham gia phai it nhat la 2",
      "any.required": "So luong nguoi tham gia la bat buoc",
    }),
    entry_fee: Joi.number().min(0).required().messages({
      "number.base": "Le phi tham gia phai la mot so",
      "number.min": "Le phi tham gia phai khong nho hon 0",
      "any.required": "Le phi tham gia la bat buoc",
    }),
    start_date: Joi.date().greater(Date.now()).required().messages({
      "date.base": "Ngay bat dau phai la mot ngay hop le",
      "date.greater": "Ngay bat dau phai sau thoi diem hien tai",
      "any.required": "Ngay bat dau la bat buoc",
    }),
    start_day_ongoing: Joi.date()
      .greater(Joi.ref("start_date"))
      .required()
      .messages({
        "date.base": "start_day_ongoing must be a valid date",
        "date.greater": "start_day_ongoing must be after start_date",
        "any.required": "start_day_ongoing is required",
      }),
    end_date: Joi.date().greater(Joi.ref("start_day_ongoing")).required().messages({
      "date.base": "Ngay ket thuc phai la mot ngay hop le",
      "date.greater": "Ngay ket thuc phai sau start_day_ongoing",
      "any.required": "Ngay ket thuc la bat buoc",
    }),
    branch_id: Joi.string().required().messages({
      "string.base": "Chi nhanh la bat buoc",
      "any.required": "Chi nhanh (branch_id) la bat buoc",
    }),
  }),
};

const getTournamentValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().allow("", null),
    required_rank: Joi.string().valid("D", "C", "B", "A").messages({
      "any.only": "Hang yeu cau khong hop le",
    }),
    branch_id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "ID chi nhanh khong dung dinh dang",
      }),
  }).unknown(true),
};

const getTournamentDetailValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID giai dau khong dung dinh dang hop le",
        "any.required": "ID giai dau la bat buoc",
      }),
  }),
};
const updateStatusValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID giải đấu không đúng định dạng hợp lệ',
        'any.required': 'ID giải đấu là bắt buộc',
      }),
  }),
  body: Joi.object({
    status: Joi.string()
      .trim() // Tự động loại bỏ dấu cách thừa ở 2 đầu (nếu có)
      .valid(
        "open_registration",
        "ongoing",
        "closed_registration",
        "completed",
      )
      .required()
      .messages({
        'string.base': 'Trạng thái phải là một chuỗi văn bản.',
        'any.only': 'Trạng thái không hợp lệ. Chỉ chấp nhận: open_registration, ongoing, closed_registration, completed.',
        'any.required': 'Trạng thái là bắt buộc.'
      }),
  }),
};
module.exports = {
  createTournamentValidation,
  getTournamentValidation,
  getTournamentDetailValidation,
  updateStatusValidation,
};
