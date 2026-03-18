const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true, // bắt buộc
      unique: true, // không được trùng lặp
      lowercase: true, // tự động chuyển thành chữ thường
      trim: true, // tạo khoảng trắng giữa 2 đầu
    },

    password: {
      type: String,
      required: function () {
        return this.auth_provider === "local"; // bắt buộc khi user đăng nhập bằng local
      },
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

    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      default: null,
      validate: {
        validator: function (value) {
          // Nếu là staff thì bắt buộc có branch_id
          if (this.role === "staff") {
            return value != null;
          }
          return true;
        },
        message: "Staff phải thuộc một chi nhánh",
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
    },
  },
  {
    timestamps: true, 
    versionKey: false, 
  }
);

const User = mongoose.model("users", userSchema);

module.exports = User;