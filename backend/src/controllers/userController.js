const userService = require("../services/userService");

class UserController {
  //gET /users
  async getUsers(req, res, next) {
    try {
      const result = await userService.getUsers(req.query, req.user);

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
      const user = await userService.getUserById(req.params.id, req.user);

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
      const user = await userService.updateUser(req.params.id, req.body, req.user);

      return res.status(200).json({
        success: true,
        message: "Cập nhật người dùng thành công",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
  // PATCH /users/:id/rank
  async updateUserRank(req, res, next) {
    try {
      const { elo_score } = req.body;

      // Gọi service, truyền vào id cần sửa, giá trị rank mới và thông tin người đang thao tác (req.user)
      const user = await userService.updateUserRank(
        req.params.id,
        { elo_score },
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Cập nhật hạng kỹ năng người chơi thành công",
        data: {
          _id: user._id,
          full_name: user.full_name,
          skill_rank: user.skill_rank,
          elo_score: user.elo_score,
        },
      });
    } catch (err) {
      next(err); // Đẩy lỗi qua Error Middleware xử lý chung
    }
  }

  // DELETE /users/:id
  async deleteUser(req, res, next) {
    try {
      // Gọi service thực hiện xóa mềm
      await userService.deleteUser(req.params.id, req.user);

      return res.status(200).json({
        success: true,
        message: "Đã Khoóa tài khoản thành công",
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }
  //GET /users/me
  async getMe(req, res, next) {
    try {
      const user = await userService.getMe(req.user);

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin thành công",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
  //PUT /users/me
  async updateMe(req, res, next) {
    try {
      const result = await userService.updateMe(req.user, req.body);

      if (result?.type === "change_password") {
        return res.status(200).json({
          success: true,
          message: "Đổi mật khẩu thành công",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const statsData = await userService.getDashboardStats(req.user);

      res.status(200).json({
        success: true,
        data: statsData,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
