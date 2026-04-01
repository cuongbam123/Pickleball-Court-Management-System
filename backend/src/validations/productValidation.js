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
    branch_id: Joi.string().hex().length(24).required(),
    name: Joi.string().trim().min(2).required(),
    type: Joi.string().valid("drink", "equipment_rental", "retail").required(),
    price: Joi.number().min(0).required(),
    stock: Joi.number().min(0).default(0),
  }),
};

const getProductById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const updateProduct = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2),
    type: Joi.string().valid("drink", "equipment_rental", "retail"),
    price: Joi.number().min(0),
  }).min(1),
};

const adjustStock = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    change_amount: Joi.number().invalid(0).required(), 
    reason: Joi.string().valid("restock", "adjustment", "refund").required(),
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