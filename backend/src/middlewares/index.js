const validate = require("./validate");
const authenticate = require("./authMiddeware");
const authorizeRoles = require("./roleMiddleware");
const errorHandler = require("./errorMiddleware");

module.exports = {
  validate,
  authenticate,
  authorizeRoles,
  errorHandler,
};