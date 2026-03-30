const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const {  validate, authenticate} = require("../middlewares");
const { registerSchema, loginSchema, refreshTokenSchema } = require("../validations/authValidation");

//endpoint
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refreshToken", validate(refreshTokenSchema), authController.refreshToken);
router.post("/logout", authenticate, validate(refreshTokenSchema), authController.logout);

module.exports = router;