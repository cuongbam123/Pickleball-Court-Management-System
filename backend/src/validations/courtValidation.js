const Joi = require("joi");

// GET COURTS BY BRANCH
const getCourtsByBranch = {
  params: Joi.object({
    branchId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(50), // Theo contract của bạn limit mặc định là 50
    type: Joi.string().valid("2-player", "4-player").allow("", null),
    status: Joi.string().valid("active", "maintenance").allow("", null),
  }),
};

// CREATE COURT
const createCourt = {
  params: Joi.object({
    branchId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).required(),
    type: Joi.string().valid("2-player", "4-player").required(),
    status: Joi.string().valid("active", "maintenance").default("active"),
  }),
};

// GET COURT DETAIL
const getCourtById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const updateCourt = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2),
    type: Joi.string().valid("2-player", "4-player"),
  }).min(1),
};

const updateCourtStatus = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    status: Joi.string().valid("active", "maintenance").required(),
  }),
};

const deleteCourt = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};
module.exports = {
  getCourtsByBranch,
  createCourt,
  getCourtById,
  updateCourt,
  updateCourtStatus,
  deleteCourt,
};
