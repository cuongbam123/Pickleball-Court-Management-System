const Joi = require("joi");
const mongoose = require("mongoose");

//ktra ObjectId hop le
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

//lay danh sach user
const getUsers = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    role: Joi.string().valid("admin", "staff", "customer"),
    search: Joi.string().allow(""),
  }),
};

//lay thong tin uúusr 
const getUserById = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
};

//cap nhat thong tin user
const updateUser = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object({
    full_name: Joi.string().min(2).max(255),
    email: Joi.string().email(),
    role: Joi.string().valid("admin", "staff", "customer"),
    branch_id: Joi.when("role", {
      is: "staff",
      then: Joi.string().custom(objectId).required(),
      otherwise: Joi.allow(null),
    }),
  }),
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
};