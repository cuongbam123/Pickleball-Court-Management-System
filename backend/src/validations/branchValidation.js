const Joi = require("joi");

// CREATE
const createBranch = {
  body: Joi.object({
    name: Joi.string().trim().min(3).required(),
    address: Joi.string().allow("", null),
    hotline: Joi.string()
      .pattern(/^[0-9]{9,11}$/)
      .required(),
    open_time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),
    close_time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),
  }),
};

// QUERY LIST
const getBranches = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
  }),
};

// PARAM ID
const getBranchById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
};