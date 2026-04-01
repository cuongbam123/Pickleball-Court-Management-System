const User = require("../models/users");
const AuditLog = require("../models/audit_logs");
const bcrypt = require("bcrypt");
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

    if (!user) throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị khóa");

    return user;
  }

  //cập nhật thông tin user
  async updateUser(id, payload, currentUser) {
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị khóa");

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

  //up rank
 async updateUserRank(id, payload, currentUser) {
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) {
      throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị khóa");
    }

    //luu log trước khi update
    const oldValue = user.toObject();

    //up rank và elo lưu vào db
    user.skill_rank = payload.skill_rank;
    user.elo_score = payload.elo_score;
    await user.save();

    const newValue = user.toObject();

    //luu log vào AuditLog
    await AuditLog.create({
      action: "update_user_rank",
      user_id: currentUser.userId,
      target_collection: "users",
      target_id: user._id,
      old_value: oldValue,
      new_value: newValue,
    });

    return newValue;
  }

  //xoa user nhung van luu db de truy van va log
  async deleteUser(id, currentUser) {
    //tim úuser
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị xóa từ trước");
    if (currentUser.userId.toString() === id) {
      throw new Error("Bạn không thể tự xóa tài khoản của chính mình");
    }

    //luu log trước khi xóa
    const oldValue = user.toObject();
    //xoa mem
    user.is_deleted = true;
    await user.save();

    const newValue = user.toObject();

    //luu log
    await AuditLog.create({
      action: "delete_user",
      user_id: currentUser.userId, //luu nguoi xoa
      target_collection: "users",
      target_id: user._id,
      old_value: oldValue,
      new_value: newValue, //doi trang thai da xoa is_deleted = true
    });

    return true;
  }
// get me
  async getMe(currentUser) {
  const user = await User.findOne({
    _id: currentUser.userId,
    is_deleted: false,
  }).select("-password");

  if (!user) {
    throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị khóa");
  }
  //log thiếu phone
   return {
    _id: user._id,
    email: user.email,
    full_name: user.full_name,
    loyalty_points: user.loyalty_points,
    loyalty_tier: user.loyalty_tier,
    skill_rank: user.skill_rank,
    elo_score: user.elo_score,
    createdAt: user.createdAt,
  };
}
  //updateMe
  async updateMe(currentUser, payload) {
  const user = await User.findOne({
    _id: currentUser.userId,
    is_deleted: false,
  });

  if (!user) {
    const error = new Error("Không tìm thấy người dùng");
    error.status = 404;
    throw error;
  }

  const oldValue = user.toObject();
  delete oldValue.password;

  let isPasswordChanged = false;
  let isProfileChanged = false;
//changePass
if (payload.old_password && payload.new_password) {
    const isMatch = await bcrypt.compare(
      payload.old_password,
      user.password
    );

    if (!isMatch) {
      const error = new Error("Mật khẩu cũ không đúng");
      error.status = 400;
      throw error;
    }

    const hashed = await bcrypt.hash(payload.new_password, 10);
    user.password = hashed;
    isPasswordChanged = true;
  }
  // update Profile (thiếu phone)
  const allowedFields = ["full_name", "phone"];

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
      isProfileChanged = true;
    }
  });

    if (isPasswordChanged || isProfileChanged) {
    await user.save();
    }
    
  const newValue = user.toObject();
  delete newValue.password;
  delete newValue.role;

  if (isPasswordChanged){
  await AuditLog.create({
    action: "update_profile",
    user_id: currentUser.userId,
    target_collection: "users",
    target_id: user._id,
    old_value: { password: "******" },
    new_value: { password: "******" },
  });
  }
  if(isProfileChanged){
    await AuditLog.create({
      action: "update_profile",
      user_id: currentUser.userId,
      target_collection: "users",
      target_id: user._id,
      old_value: oldValue,
      new_value: newValue,
    })
  }
if (isPasswordChanged && !isProfileChanged) {
    return { message: "Đổi mật khẩu thành công" };
  }
return newValue;
}
}

module.exports = new UserService();
