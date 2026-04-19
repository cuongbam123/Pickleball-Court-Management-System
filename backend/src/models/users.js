const mongoose = require("mongoose");
const { getSkillRankFromElo } = require("../utils/userRank");

// ================= MAIN SCHEMA =================
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
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
      enum: ["admin", "manager", "staff", "customer"],
      default: "customer",
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      default: null,
      validate: {
        validator(value) {
          if (this.role === "staff" || this.role === "manager") {
            return !!value;
          }
          return true;
        },
        message: "role staff/manager bat buoc phai co branch_id",
      },
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
      min: 0,
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

userSchema.pre("validate", function autoSkillRankByElo(next) {
  this.skill_rank = getSkillRankFromElo(this.elo_score);
  next();
});

userSchema.pre("findOneAndUpdate", function autoRankWhenUpdatingElo(next) {
  const update = this.getUpdate() || {};
  const nextElo =
    update.elo_score !== undefined ? update.elo_score : update.$set?.elo_score;

  if (nextElo !== undefined) {
    const derivedRank = getSkillRankFromElo(nextElo);
    if (update.$set) {
      update.$set.skill_rank = derivedRank;
    } else {
      update.skill_rank = derivedRank;
    }
    this.setUpdate(update);
  }

  next();
});

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
