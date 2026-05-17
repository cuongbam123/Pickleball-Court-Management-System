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
    start_day_ongoing: Joi.date()
      .greater(Joi.ref("start_date"))
      .required()
      .messages({
        "date.base": "start_day_ongoing must be a valid date",
        "date.greater": "start_day_ongoing must be after start_date",
        "any.required": "start_day_ongoing is required",
      }),
    end_date: Joi.date()
      .greater(Joi.ref("start_day_ongoing"))
      .required()
      .messages({
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

const getTournamentValidation = {
  query: Joi.object({
    // Phân trang
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    // Tìm kiếm theo tên
    search: Joi.string().trim().allow("", null),
    // Lọc theo hạng (Rank)
    required_rank: Joi.string().valid("D", "C", "B", "A").messages({
      'any.only': 'Hạng yêu cầu không hợp lệ'
    }),
    // Lọc theo chi nhánh (Phải là định dạng ObjectId của MongoDB)
    branch_id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'ID chi nhánh không đúng định dạng'
      }),
  }).unknown(true), // Cho phép các tham số khác không định nghĩa nhưng sẽ không báo lỗi
};

const getTournamentDetailValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/) // Kiểm tra đúng định dạng 24 ký tự Hex của MongoDB
      .required()
      .messages({
        'string.pattern.base': 'ID giải đấu không đúng định dạng hợp lệ',
        'any.required': 'ID giải đấu là bắt buộc',
      }),
  }),
};
const updateStatusValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID giải đấu không đúng định dạng hợp lệ",
        "any.required": "ID giải đấu là bắt buộc",
      }),
  }),
  body: Joi.object({
    status: Joi.string()
      .trim() // Tự động loại bỏ dấu cách thừa ở 2 đầu (nếu có)
      .valid(
        "open_registration",
        "close_registration",
        "ongoing",
        "completed",
      )
      .required()
      .messages({
        "string.base": "Trạng thái phải là một chuỗi văn bản.",
        "any.only":
          "Trạng thái không hợp lệ. Chỉ chấp nhận: open_registration, close_registration, ongoing, completed.",
        "any.required": "Trạng thái là bắt buộc.",
      }),
  }),
};

const updateTournamentValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID giải đấu không đúng định dạng hợp lệ",
        "any.required": "ID giải đấu là bắt buộc",
      }),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(255),
    required_rank: Joi.string().valid("D", "C", "B", "A"),
    max_participants: Joi.number().integer().min(2).max(10000),
    entry_fee: Joi.number().min(0),
    start_date: Joi.date().greater("now"),
    start_day_ongoing: Joi.date().when("start_date", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("start_date")),
    }),
    end_date: Joi.date().when("start_day_ongoing", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("start_day_ongoing")),
    }),
    branch_id: Joi.string().length(24).hex(),
  }).unknown(false),
};

const deleteTournamentValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID giải đấu không đúng định dạng hợp lệ",
        "any.required": "ID giải đấu là bắt buộc",
      }),
  }),
};

const registerForTournamentValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID không hợp lệ",
        "any.required": "ID là bắt buộc",
      }),
  }),
};

const getParticipantsValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID giải đấu không đúng định dạng hợp lệ",
        "any.required": "ID giải đấu là bắt buộc",
      }),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().allow("", null),
    payment_status: Joi.string().valid("pending", "paid").messages({
      "any.only": "Trạng thái thanh toán không hợp lệ",
    }),
    result: Joi.string().valid("winner", "runner_up", "participant").messages({
      "any.only": "Kết quả không hợp lệ",
    }),
  }).unknown(true),
};

const generateBracketsValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID giải đấu không đúng định dạng hợp lệ",
        "any.required": "ID giải đấu là bắt buộc",
      }),
  }),
  body: Joi.object({
    group_size: Joi.number().integer().min(2).default(4).messages({
      "number.base": "group_size phải là số nguyên",
      "number.integer": "group_size phải là số nguyên",
      "number.min": "group_size phải lớn hơn hoặc bằng 2",
    }),
  }),
};

const getBracketsValidation = {
  params: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID giải đấu không đúng định dạng hợp lệ",
        "any.required": "ID giải đấu là bắt buộc",
      }),
  }),
};

module.exports = {
  createTournamentValidation,
  getTournamentValidation,
  getTournamentDetailValidation,
  registerForTournamentValidation,
  getParticipantsValidation,
  deleteTournamentValidation,
  updateStatusValidation,
  updateTournamentValidation,
  generateBracketsValidation,
  getBracketsValidation,
};
