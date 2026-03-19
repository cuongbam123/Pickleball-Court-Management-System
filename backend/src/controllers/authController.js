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
// cấp mới Token
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    const data = await authService.refreshToken(refresh_token);

    return res.status(200).json({
      success: true,
      message: "Cấp lại mã truy cập thành công",
      data,
    });
  } catch (error) {
    return res.status(error.status || 403).json({
      success: false,
      error_code: "REFRESH_TOKEN_FAILED",
      message: error.message,
    });
  }
};

// logout
const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    await authService.logout(refresh_token);

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Đăng xuất thất bại",
    });
  }
};
module.exports = {
  register,
  login,
  refreshToken,
  logout,
};