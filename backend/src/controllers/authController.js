const authService = require("../services/authService");

//Dky
const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      error_code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
};

//login
const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      error_code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};