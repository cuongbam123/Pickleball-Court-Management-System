const Joi = require("joi");

//ktra mk thuong,hoa,kytu,so
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "any.required": "Email là bắt buộc",
    }),
    password: Joi.string().pattern(passwordRegex).required().messages({
      "string.pattern.base":
        "Password phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
      "any.required": "Password là bắt buộc",
    }),
    full_name: Joi.string().min(2).max(100).required(),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "any.required": "Email là bắt buộc",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password là bắt buộc",
    }),
  }),
};

const refreshTokenSchema = {
  body: Joi.object({
    refresh_token: Joi.string().required().messages({
      "string.empty": "Refresh token không được để trống",
      "any.required": "Refresh token là bắt buộc để thực hiện thao tác này",
    }),
  }),
};
module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};