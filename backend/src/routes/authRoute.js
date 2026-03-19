const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { validate } = require("../middlewares/validate");
const { registerSchema, loginSchema, refreshTokenSchema } = require("../validations/authValidation");

//endpoint
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refreshToken", validate(refreshTokenSchema), authController.refreshToken);
router.post("/logout", validate(refreshTokenSchema), authController.logout);

module.exports = router;