const userService = require("../services/userService");

class UserController {
  //gET /users
  async getUsers(req, res, next) {
    try {
      const result = await userService.getUsers(req.query);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách người dùng thành công",
        data: result.users,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /users/:id
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết người dùng thành công",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  // PUT /users/:id
  async updateUser(req, res, next) {
  try {
    // console.log("Data dc giai ma: ", req.user);
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

}

module.exports = new UserController();