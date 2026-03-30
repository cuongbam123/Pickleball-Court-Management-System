const validate = require("./validate");
const { authenticate, optionalAuth} = require("./authMiddeware");
const authorizeRoles = require("./roleMiddleware");
const errorHandler = require("./errorMiddleware");

module.exports = {
  validate,
  authenticate,
  optionalAuth,
  authorizeRoles,
  errorHandler,
};