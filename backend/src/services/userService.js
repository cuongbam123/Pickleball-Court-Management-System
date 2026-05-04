const User = require("../models/users");
const AuditLog = require("../models/audit_logs");
const Branch = require("../models/branches");
const Court = require("../models/court");
const bcrypt = require("bcrypt");
const {
  isAdmin,
  isManager,
  toIdString,
  assertHasBranchScope,
  assertManagerBranchAccess,
  assertStaffOrManagerBranchAccess,
} = require("../utils/accessControl");

class UserService {
  async resolveCurrentUser(currentUser) {
    if (!currentUser?.userId) return null;
    const actor = await User.findById(currentUser.userId).select(
      "_id role branch_id is_deleted",
    );
    if (!actor || actor.is_deleted) {
      const error = new Error("Tài khoản thao tác không hợp lệ");
      error.statusCode = 401;
      throw error;
    }
    return actor;
  }

  getUserSort(query = {}) {
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const sortBy = query.sortBy || "createdAt";

    if (["role", "skill_rank", "loyalty_tier", "full_name", "createdAt"].includes(sortBy)) {
      return { [sortBy]: sortOrder };
    }

    return { createdAt: -1 };
  }

  //lấy danh sách user
  async getUsers(query, currentUser) {
    const { page = 1, limit = 20, role, search } = query;
    const actor = await this.resolveCurrentUser(currentUser);

    const filter = { is_deleted: false };

    if (role) filter.role = role;

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { full_name: { $regex: search, $options: "i" } },
      ];
    }

    if (isManager(actor)) {
      assertHasBranchScope(actor);
      filter.branch_id = actor.branch_id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = this.getUserSort(query);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sort)
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
  async getUserById(id, currentUser) {
    const actor = await this.resolveCurrentUser(currentUser);
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    }).select("-password");

    if (!user) throw new Error("Khong tim thay nguoi dung hoac tai khoan da bi khoa");

    assertManagerBranchAccess(
      actor,
      user.branch_id,
      "Manager chi duoc xem nguoi dung trong chi nhanh cua minh",
    );

    return user;
  }

  //cập nhật thông tin user
  async updateUser(id, payload, currentUser) {
    const actor = await this.resolveCurrentUser(currentUser);
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị khóa");

    assertManagerBranchAccess(
      actor,
      user.branch_id,
      "Manager chi duoc cap nhat nguoi dung trong chi nhanh cua minh",
    );

    if (isManager(actor)) {
      if (["admin", "manager"].includes(user.role)) {
        const error = new Error("Manager không được chỉnh sửa tài khoản admin/manager");
        error.statusCode = 403;
        throw error;
      }

      if (payload.role && payload.role !== user.role) {
        const isOnlyAllowedDowngrade =
          user.role === "staff" && payload.role === "customer";

        if (!isOnlyAllowedDowngrade) {
          const error = new Error(
            "Manager chỉ được phép chuyển role từ staff sang customer",
          );
          error.statusCode = 403;
          throw error;
        }
      }

      if (
        payload.branch_id !== undefined &&
        toIdString(payload.branch_id) !== toIdString(user.branch_id)
      ) {
        const error = new Error("Manager không được chuyển nhân viên sang chi nhánh khác");
        error.statusCode = 403;
        throw error;
      }
    }

    if (actor._id.toString() === id && payload.role && payload.role !== user.role) {
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

    if (isManager(actor)) {
      const managerBranchId = toIdString(actor.branch_id);
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
      user_id: actor._id,
      target_collection: "users",
      target_id: user._id,
      old_value: oldValue,
      new_value: newValue,
    });

    return newValue;
  }

  async createStaffAccount(payload, currentUser) {
    const actor = await this.resolveCurrentUser(currentUser);
    const isManagerRole = isManager(actor);
    const isAdminRole = isAdmin(actor);

    if (!isManagerRole && !isAdminRole) {
      const error = new Error("Bạn không có quyền tạo tài khoản nhân viên");
      error.statusCode = 403;
      throw error;
    }

    const targetBranchId = isManagerRole
      ? toIdString(actor.branch_id)
      : toIdString(payload.branch_id);

    if (isManagerRole && !targetBranchId) {
      const error = new Error("Manager phải được gán branch_id trước khi tạo nhân viên");
      error.statusCode = 403;
      throw error;
    }

    if (isAdminRole && !targetBranchId) {
      throw new Error("Admin tạo nhân viên bắt buộc chọn chi nhánh");
    }

    const existingUser = await User.findOne({
      email: payload.email.toLowerCase().trim(),
      is_deleted: false,
    });

    if (existingUser) {
      if (existingUser.role !== "customer") {
        const error = new Error("Email này đã thuộc tài khoản không phải customer");
        error.statusCode = 409;
        throw error;
      }

      const oldValue = existingUser.toObject();
      existingUser.role = "staff";
      existingUser.branch_id = targetBranchId;
      existingUser.full_name = payload.full_name || existingUser.full_name;
      if (payload.phone !== undefined) existingUser.phone = payload.phone;
      await existingUser.save();

      await AuditLog.create({
        action: "promote_customer_to_staff",
        user_id: actor._id,
        target_collection: "users",
        target_id: existingUser._id,
        old_value: oldValue,
        new_value: existingUser.toObject(),
      });

      return {
        message: "Đã chuyển tài khoản customer sang staff thành công",
        user: existingUser.toObject(),
      };
    }

    if (!payload.password) {
      throw new Error("Tạo tài khoản mới bắt buộc nhập mật khẩu");
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const createdUser = await User.create({
      full_name: payload.full_name,
      email: payload.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: payload.phone || "",
      role: "staff",
      branch_id: targetBranchId,
      auth_provider: "local",
    });

    await AuditLog.create({
      action: "create_staff_account",
      user_id: actor._id,
      target_collection: "users",
      target_id: createdUser._id,
      old_value: null,
      new_value: createdUser.toObject(),
    });

    return {
      message: "Tạo tài khoản staff thành công",
      user: createdUser.toObject(),
    };
  }

  //up rank
 async updateUserRank(id, payload, currentUser) {
    const actor = await this.resolveCurrentUser(currentUser);
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) {
      throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị khóa");
    }

    // Không cho tự cập nhật rank của chính mình (tránh staff/manager tự buff)
    if (actor._id && actor._id.toString() === id.toString()) {
      const error = new Error("Ban khong the tu cap nhat rank cua chinh minh");
      error.statusCode = 403;
      throw error;
    }

    // Staff chỉ được cập nhật rank cho customer trong cùng chi nhánh
    if (actor.role === "staff") {
      if (user.role !== "customer") {
        const error = new Error("Staff chi duoc cap nhat rank cho khach hang");
        error.statusCode = 403;
        throw error;
      }
      assertStaffOrManagerBranchAccess(
        actor,
        user.branch_id,
        "Staff chi duoc cap nhat rank trong chi nhanh cua minh",
      );
    }

    // Manager chỉ được thao tác trong chi nhánh của mình; ngoài ra không cho đụng vào admin
    if (actor.role === "manager" && user.role === "admin") {
      const error = new Error("Manager khong duoc cap nhat rank cua admin");
      error.statusCode = 403;
      throw error;
    }

    assertManagerBranchAccess(
      actor,
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
      user_id: actor._id,
      target_collection: "users",
      target_id: user._id,
      old_value: oldValue,
      new_value: newValue,
    });

    return newValue;
  }

  //xoa user nhung van luu db de truy van va log
  async deleteUser(id, currentUser) {
    const actor = await this.resolveCurrentUser(currentUser);
    //tim úuser
    const user = await User.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!user) throw new Error("Không tìm thấy người dùng hoặc tài khoản đã bị xóa trước đó");

    if (actor._id.toString() === id) {
      throw new Error("Bạn không thể tự xóa tài khoản của chính mình");
    }

    assertManagerBranchAccess(
      actor,
      user.branch_id,
      "Manager chi duoc khoa tai khoan trong chi nhanh cua minh",
    );

    if (isManager(actor) && user.role === "admin") {
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
      user_id: actor._id,
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
    const actor = await this.resolveCurrentUser(currentUser);
    const isManagerRole = isManager(actor);

    if (isManagerRole) {
      assertHasBranchScope(actor);
    }

    const branchScope = isManagerRole
      ? { _id: actor.branch_id, is_deleted: false }
      : { is_deleted: false };

    const courtScope = isManagerRole
      ? { status: "active", is_deleted: false, branch_id: actor.branch_id }
      : { status: "active", is_deleted: false };

    const staffScope = isManagerRole
      ? { role: "staff", is_deleted: false, branch_id: actor.branch_id }
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
