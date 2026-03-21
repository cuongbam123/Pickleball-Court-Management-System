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

//update rank
const updateUserRank = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object({
    skill_rank: Joi.string().valid("D", "C", "B", "A").required(),
    elo_score: Joi.number().min(0).required(),
  }),
};

//xoa usser nhma van luu db de truy van
const deleteUser = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
};
//updateMe
const updateMe = {
  body: Joi.object({
    full_name: Joi.string().min(2).max(255),
    phone: Joi.string().pattern(/^[0-9]{9,11}$/),

    old_password: Joi.string(),
    new_password: Joi.string().min(6),
  })
    .or("full_name", "phone", "old_password")
    .with("old_password", "new_password")
    .with("new_password", "old_password"),
};
module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserRank,
  deleteUser,
  updateMe,
};