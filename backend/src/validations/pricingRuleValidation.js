const Joi = require("joi");

const COURT_TYPES = ["2-player", "4-player", "all"];
const DAY_TYPES = ["weekday", "weekend", "holiday"];
const TIME_TYPES = ["normal", "golden"];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const toMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const getPricingRulesQuerySchema = Joi.object({
  branch_id: Joi.string()
    .optional(),
  court_type: Joi.string()
    .valid(...COURT_TYPES)
    .optional(),

  day_type: Joi.string()
    .valid(...DAY_TYPES)
    .optional(),

  time_type: Joi.string()
    .valid(...TIME_TYPES)
    .optional(),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50),
});

const pricingRuleIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(objectIdRegex)
    .required()
    .messages({
      "string.pattern.base": "id không hợp lệ",
      "any.required": "id là bắt buộc",
    }),
});

const createPricingRuleBodySchema = Joi.object({
  branch_id: Joi.string()
    .required()
    .messages({
    "any.required": "branch_id là bắt buộc"
    }),
  court_type: Joi.string()
    .valid(...COURT_TYPES)
    .required(),

  day_type: Joi.string()
    .valid(...DAY_TYPES)
    .required(),

  time_type: Joi.string()
    .valid(...TIME_TYPES)
    .required(),

  start_time: Joi.string()
    .pattern(timeRegex)
    .required()
    .messages({
      "string.pattern.base": "start_time phải đúng định dạng HH:mm",
    }),

  end_time: Joi.string()
    .pattern(timeRegex)
    .required()
    .messages({
      "string.pattern.base": "end_time phải đúng định dạng HH:mm",
    }),

  price_per_hour: Joi.number()
    .positive()
    .required(),
})
.custom((value, helpers) => {
  const start = toMinutes(value.start_time);
  const end = toMinutes(value.end_time);

  if (start >= end) {
    return helpers.error("any.invalid");
  }

  return value;
})
.messages({
  "any.invalid": "start_time phải nhỏ hơn end_time",
});

const updatePricingRuleBodySchema = Joi.object({
  branch_id: Joi.string()
    .pattern(objectIdRegex)
    .optional()
    .messages({
      "string.pattern.base": "branch_id không hợp lệ",
    }),

  court_type: Joi.string().valid(...COURT_TYPES).optional(),

  day_type: Joi.string().valid(...DAY_TYPES).optional(),

  time_type: Joi.string().valid(...TIME_TYPES).optional(),

  start_time: Joi.string()
    .pattern(timeRegex)
    .optional()
    .messages({
      "string.pattern.base": "start_time phải đúng định dạng HH:mm",
    }),

  end_time: Joi.string()
    .pattern(timeRegex)
    .optional()
    .messages({
      "string.pattern.base": "end_time phải đúng định dạng HH:mm",
    }),

  price_per_hour: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      "number.base": "price_per_hour phải là số",
      "number.integer": "price_per_hour phải là số nguyên",
      "number.positive": "price_per_hour phải lớn hơn 0",
    }),
})
.min(1)
.custom((value, helpers) => {
  if (value.start_time && value.end_time) {
    const start = toMinutes(value.start_time);
    const end = toMinutes(value.end_time);

    if (start >= end) {
      return helpers.error("any.invalid");
    }
  }

  return value;
})
.messages({
  "object.min": "Cần ít nhất 1 trường để cập nhật",
  "any.invalid": "start_time phải nhỏ hơn end_time",
});
module.exports = {
  getPricingRulesQuerySchema,
  pricingRuleIdParamSchema,
  createPricingRuleBodySchema,
  updatePricingRuleBodySchema,
};