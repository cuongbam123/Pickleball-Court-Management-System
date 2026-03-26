const Joi = require("joi");

const COURT_TYPES = ["2-player", "4-player", "all"];
const DAY_TYPES = ["weekday", "weekend", "holiday"];
const TIME_TYPES = ["normal", "golden"];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
  const toMinutes = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  };

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

module.exports = {
  getPricingRulesQuerySchema,
  createPricingRuleBodySchema,
};