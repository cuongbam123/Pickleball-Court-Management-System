const Joi = require('joi');

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('ID không đúng định dạng MongoDB');
  }
  return value;
};

const getOrders = {
  query: Joi.object().keys({
    branch_id: Joi.string().custom(objectId),
    date: Joi.string().pattern(/^\d{2}-\d{2}-\d{4}$/).allow(''), 
    payment_status: Joi.string().valid('deposit_paid', 'pending_final', 'fully_paid').allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const getOrderDetail = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const payDeposit = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(), 
  }),
  body: Joi.object().keys({
    payment_method: Joi.string().valid('vnpay', 'momo').required(),
    redirect_url: Joi.string().uri().required(), 
  }),
};

const addPosItems = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    items: Joi.array().items(
      Joi.object().keys({
        product_id: Joi.string().custom(objectId).required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
  }),
};

const updatePosItem = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    product_id: Joi.string().custom(objectId).required(),
    quantity: Joi.number().integer().min(0).required().messages({
      "number.min": "Số lượng nhỏ nhất là 0 (Truyền 0 để xóa sản phẩm)"
    }),
  }),
};

const checkoutOrder = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    payment_method: Joi.string().valid('cash', 'transfer').required(),
    amount_received: Joi.number().min(0).required(),
  }),
};

module.exports = {
  getOrders,
  getOrderDetail,
  payDeposit,
  addPosItems,
  updatePosItem,
  checkoutOrder,
};