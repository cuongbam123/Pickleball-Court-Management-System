const Joi = require("joi");
const mongoose = require("mongoose");

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

const getUsers = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    role: Joi.string().valid("admin", "manager", "staff", "customer"),
    search: Joi.string().allow(""),
  }),
};

const getUserById = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateUser = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object({
    full_name: Joi.string().min(2).max(255),
    email: Joi.string().email(),
    role: Joi.string().valid("admin", "manager", "staff", "customer"),
    phone: Joi.string().pattern(/^[0-9]{9,11}$/),
    branch_id: Joi.when("role", {
      switch: [
        {
          is: "staff",
          then: Joi.string().custom(objectId).required(),
        },
        {
          is: "manager",
          then: Joi.string().custom(objectId).required(),
        },
      ],
      otherwise: Joi.string().custom(objectId).allow(null),
    }),
    elo_score: Joi.number().min(0),
  }).min(1),
};

const updateUserRank = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object({
    elo_score: Joi.number().min(0).required(),
    skill_rank: Joi.forbidden().messages({
      "any.unknown": "skill_rank se duoc he thong tu dong tinh theo elo_score",
    }),
  }),
};

const deleteUser = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateMe = {
  body: Joi.object({
    full_name: Joi.string().min(2).max(255),
    phone: Joi.string().pattern(/^[0-9]{9,11}$/),

    old_password: Joi.string(),

    new_password: Joi.string().min(6).invalid(Joi.ref("old_password")).messages({
      "any.invalid": "Mat khau moi khong duoc trung voi mat khau cu",
    }),

    confirm_new_password: Joi.string().valid(Joi.ref("new_password")).messages({
      "any.only": "Xac nhan mat khau moi khong khop",
    }),
  })
    .or("full_name", "phone", "old_password")
    .with("old_password", "new_password")
    .with("new_password", "old_password")
    .with("new_password", "confirm_new_password"),
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserRank,
  deleteUser,
  updateMe,
};
