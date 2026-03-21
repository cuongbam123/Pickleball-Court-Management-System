const User = require("../models/users");
const AuditLog = require("../models/audit_logs");

class UserService {
  //lấy danh sách user
  async getUsers(query) {
    const { page = 1, limit = 20, role, search } = query;

    const filter = { is_deleted: false };

    if (role) filter.role = role;

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { full_name: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
  //lay chi tiet user
  async getUserById(id) {
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    }).select("-password");

    if (!user) throw new Error("User not found");

    return user;
  }

  //cập nhật thông tin user
  async updateUser(id, payload, currentUser) {
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) throw new Error("User not found");

    if (
      currentUser.userId.toString() === id &&
      payload.role &&
      payload.role !== "admin"
    ) {
      throw new Error("Bạn không thể tự hạ quyền của chính mình");
    }

    //check email nếu có thay đổi(xem co trung email khong)
    if (payload.email && payload.email !== user.email) {
      const existed = await User.findOne({
        email: payload.email,
        _id: { $ne: id },
      });

      if (existed) {
        throw new Error("Email đã tồn tại");
      }
    }

    //staff phải có branch_id
    if (payload.role === "staff" && !payload.branch_id) {
      throw new Error("Staff phải có branch_id");
    }

    //luu log trước khi update
    const oldValue = user.toObject();
    //update
    Object.assign(user, payload);
    await user.save();

    const newValue = user.toObject();

    //luu log
    await AuditLog.create({
      action: "update_user",
      user_id: currentUser.userId,
      target_collection: "users",
      target_id: user._id,
      old_value: oldValue,
      new_value: newValue,
    });

    return newValue;
  }
}

module.exports = new UserService();
