const User = require("../models/users");
const AuditLog = require("../models/audit_logs");
const Branch = require("../models/branches");
const Court = require("../models/court");
const bcrypt = require("bcrypt");
const {
  isManager,
  toIdString,
  assertHasBranchScope,
  assertManagerBranchAccess,
} = require("../utils/accessControl");

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

    if (isManager(currentUser)) {
      assertHasBranchScope(currentUser);
      filter.branch_id = currentUser.branch_id;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total_records: total,
        total_pages: Math.ceil(total / Number(limit)),
      },
    };
  }
  //lay chi tiet user
  async getUserById(id) {
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    }).select("-password");

    if (!user) throw new Error("Khong tim thay nguoi dung hoac tai khoan da bi khoa");

    assertManagerBranchAccess(
      currentUser,
      user.branch_id,
      "Manager chi duoc xem nguoi dung trong chi nhanh cua minh",
    );

    return user;
  }

  //cập nhật thông tin user
  async updateUser(id, payload, currentUser) {
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị khóa");

    assertManagerBranchAccess(
      currentUser,
      user.branch_id,
      "Manager chi duoc cap nhat nguoi dung trong chi nhanh cua minh",
    );

    if (isManager(currentUser) && payload.role === "admin") {
      const error = new Error("Manager khong duoc gan role admin");
      error.statusCode = 403;
      throw error;
    }

    if (
      currentUser.userId.toString() === id &&
      payload.role &&
      payload.role !== user.role
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

    const nextRole = payload.role || user.role;
    const nextBranchId =
      payload.branch_id !== undefined ? payload.branch_id : user.branch_id;

    if ((nextRole === "staff" || nextRole === "manager") && !nextBranchId) {
      throw new Error("Role staff/manager bat buoc phai co branch_id");
    }

    if (nextRole === "admin") {
      payload.branch_id = null;
    }

    if (isManager(currentUser)) {
      const managerBranchId = toIdString(currentUser.branch_id);
      if (
        payload.branch_id !== undefined &&
        toIdString(payload.branch_id) !== managerBranchId
      ) {
        const error = new Error("Manager chi duoc gan branch_id cua chi nhanh minh");
        error.statusCode = 403;
        throw error;
      }
    }

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

    assertManagerBranchAccess(
      currentUser,
      user.branch_id,
      "Manager chi duoc cap nhat rank trong chi nhanh cua minh",
    );

       //luu log trước khi update
    const oldValue = user.toObject();
    //up rank và elo lưu vào db

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

    if (!user) throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị xóa trước đó");

    if (currentUser.userId.toString() === id) {
      throw new Error("Bạn không thể tự xóa tài khoản của chính mình");
    }

    assertManagerBranchAccess(
      currentUser,
      user.branch_id,
      "Manager chi duoc khoa tai khoan trong chi nhanh cua minh",
    );

    if (isManager(currentUser) && user.role === "admin") {
      const error = new Error("Manager khong duoc xoa tai khoan admin");
      error.statusCode = 403;
      throw error;
    }

    const oldValue = user.toObject();
    //xoa mem
    user.is_deleted = true;
    await user.save();

    const newValue = user.toObject();

    //luu log
    await AuditLog.create({
      action: "delete_user",
      user_id: currentUser.userId,
      target_collection: "users",
      target_id: user._id,
      old_value: oldValue,
      new_value: newValue,
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
      throw new Error("Khong tim thay nguoi dung hoac tai khoan da bi khoa");
    }

    return {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      branch_id: user.branch_id,
      credit: user.credit,
      loyalty_points: user.loyalty_points,
      loyalty_tier: user.loyalty_tier,
      skill_rank: user.skill_rank,
      elo_score: user.elo_score,
      createdAt: user.createdAt,
    };
  }

  async updateMe(currentUser, payload) {
    const user = await User.findOne({
      _id: currentUser.userId,
      is_deleted: false,
    });

    if (!user) {
      const error = new Error("Khong tim thay nguoi dung");
      error.status = 404;
      throw error;
    }

    const oldValue = user.toObject();
    delete oldValue.password;

    let isPasswordChanged = false;
    let isProfileChanged = false;

    if (payload.old_password && payload.new_password) {
      const isMatch = await bcrypt.compare(payload.old_password, user.password);

      if (!isMatch) {
        const error = new Error("Mat khau cu khong dung");
        error.status = 400;
        throw error;
      }

      const hashed = await bcrypt.hash(payload.new_password, 10);
      user.password = hashed;
      isPasswordChanged = true;
    }

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

    if (isPasswordChanged) {
      await AuditLog.create({
        action: "update_profile",
        user_id: currentUser.userId,
        target_collection: "users",
        target_id: user._id,
        old_value: { password: "******" },
        new_value: { password: "******" },
      });
    }

    if (isProfileChanged) {
      await AuditLog.create({
        action: "update_profile",
        user_id: currentUser.userId,
        target_collection: "users",
        target_id: user._id,
        old_value: oldValue,
        new_value: newValue,
      });
    }

    if (isPasswordChanged && !isProfileChanged) {
      return { message: "Doi mat khau thanh cong" };
    }

    return newValue;
  }

  async getDashboardStats(currentUser) {
    const isManagerRole = isManager(currentUser);

    if (isManagerRole) {
      assertHasBranchScope(currentUser);
    }

    const branchScope = isManagerRole
      ? { _id: currentUser.branch_id, is_deleted: false }
      : { is_deleted: false };

    const courtScope = isManagerRole
      ? { status: "active", is_deleted: false, branch_id: currentUser.branch_id }
      : { status: "active", is_deleted: false };

    const staffScope = isManagerRole
      ? { role: "staff", is_deleted: false, branch_id: currentUser.branch_id }
      : { role: "staff", is_deleted: false };

    const [totalBranches, activeCourts, totalStaff, monthlyRevenue] =
      await Promise.all([
        Branch.countDocuments(branchScope),
        Court.countDocuments(courtScope),
        User.countDocuments(staffScope),
        Promise.resolve(0),
      ]);

    return {
      totalBranches,
      activeCourts,
      totalStaff,
      monthlyRevenue,
    };
  }
}

module.exports = new UserService();
