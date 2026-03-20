const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Tự động tạo Unique Index
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Việc kiểm tra bắt buộc nhập password cho tài khoản 'local' sẽ nằm ở AuthService
    },
    auth_provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer",
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      trime: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      default: null,
      // Logic bắt buộc staff phải có branch_id sẽ được kiểm tra ở Service Layer
    },
    loyalty_points: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyalty_tier: {
      type: String,
      enum: ["standard", "silver", "gold", "diamond"],
      default: "standard",
    },
    skill_rank: {
      type: String,
      enum: ["D", "C", "B", "A"],
      default: "D",
    },
    elo_score: {
      type: Number,
      default: 1000,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ================= INDEX =================

// Phục vụ truy vấn: Lọc danh sách nhân viên theo từng chi nhánh
userSchema.index({ branch_id: 1, role: 1 });

// Phục vụ truy vấn: Lọc nhanh user theo Role (VD: Lấy danh sách toàn bộ Staff/Admin)
userSchema.index({ role: 1 });

// Phục vụ truy vấn (Leaderboard): Xếp hạng người chơi theo Elo Score (Cao xuống thấp)
userSchema.index({ elo_score: -1 });

// Phục vụ truy vấn: Xếp hạng/Lọc khách hàng VIP theo điểm Loyalty
userSchema.index({ loyalty_points: -1 });

// ================= MODEL =================
const User = mongoose.model("users", userSchema);

module.exports = User;