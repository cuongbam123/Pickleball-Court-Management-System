const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const courtSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["2-player", "4-player"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "maintenance"],
      default: "active",
    },
    tagStatus: {
      type: String,
      enum: ["available", "booked", "playing"],
      default: "available",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt, updatedAt
    versionKey: false,
  }
);

// ================= INDEX =================

// Đảm bảo không có 2 sân trùng tên trong cùng một chi nhánh
// Đồng thời hỗ trợ cực tốt cho truy vấn tìm tất cả sân theo chi nhánh (Left-Prefix Rule)
courtSchema.index({ branch_id: 1, name: 1 }, { unique: true });

// Tối ưu hóa truy vấn: Tìm các sân đang "active" tại một chi nhánh cụ thể để khách đặt
courtSchema.index({ branch_id: 1, status: 1 });

// ================= MODEL =================
const Court = mongoose.model("courts", courtSchema);

module.exports = Court;