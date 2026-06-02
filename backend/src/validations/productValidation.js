const Joi = require("joi");

const getProducts = {
  query: Joi.object({
    branch_id: Joi.string().hex().length(24).required().messages({
      "any.required": "branch_id là bắt buộc để lọc sản phẩm theo chi nhánh",
    }),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(50),
    type: Joi.string().valid("drink", "equipment_rental", "retail").allow("", null),
    search: Joi.string().allow("", null),
  }),
};

const createProduct = {
  body: Joi.object({
    branch_id: Joi.string().hex().length(24).required().messages({
      "any.required": "Chi nhánh là bắt buộc",
      "string.empty": "Chi nhánh không được trống",
      "string.length": "ID chi nhánh không hợp lệ",
    }),
    name: Joi.string().trim().min(2).required().messages({
      "any.required": "Tên sản phẩm là bắt buộc",
      "string.empty": "Tên sản phẩm không được trống",
      "string.min": "Tên sản phẩm phải có ít nhất {#limit} ký tự",
    }),
    type: Joi.string().valid("drink", "equipment_rental", "retail").required().messages({
      "any.required": "Phân loại sản phẩm là bắt buộc",
      "any.only": "Phân loại không hợp lệ (phải là Nước uống, Thuê dụng cụ hoặc Bán lẻ)",
    }),
    price: Joi.number().min(0).required().messages({
      "any.required": "Giá bán là bắt buộc",
      "number.base": "Giá bán phải là một số",
      "number.min": "Giá bán không được nhỏ hơn {#limit}",
    }),
    stock: Joi.number().min(0).default(0).messages({
      "number.base": "Số lượng tồn kho phải là một số",
      "number.min": "Số lượng tồn kho không được nhỏ hơn {#limit}",
    }),
  }),
};

const getProductById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required().messages({
      "string.length": "ID sản phẩm không hợp lệ",
    }),
  }),
};

const updateProduct = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required().messages({
      "string.length": "ID sản phẩm không hợp lệ",
    }),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).messages({
      "string.empty": "Tên sản phẩm không được trống",
      "string.min": "Tên sản phẩm phải có ít nhất {#limit} ký tự",
    }),
    type: Joi.string().valid("drink", "equipment_rental", "retail").messages({
      "any.only": "Phân loại không hợp lệ",
    }),
    price: Joi.number().min(0).messages({
      "number.base": "Giá bán phải là một số",
      "number.min": "Giá bán không được nhỏ hơn {#limit}",
    }),
  }).min(1).messages({
    "object.min": "Vui lòng cập nhật ít nhất một thông tin",
  }),
};

const adjustStock = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required().messages({
      "string.length": "ID sản phẩm không hợp lệ",
    }),
  }),
  body: Joi.object({
    change_amount: Joi.number().invalid(0).required().messages({
      "any.required": "Số lượng giao dịch là bắt buộc",
      "number.base": "Số lượng giao dịch phải là một số",
      "number.invalid": "Số lượng giao dịch không được bằng 0",
    }),
    reason: Joi.string().valid("restock", "adjustment", "refund").required().messages({
      "any.required": "Lý do giao dịch là bắt buộc",
      "any.only": "Lý do giao dịch không hợp lệ",
    }),
    note: Joi.string().trim().allow("", null),
  }),
};

const deleteProduct = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
};