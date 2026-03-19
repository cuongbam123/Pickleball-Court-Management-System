const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Thêm unique để tránh tạo trùng tên chi nhánh
    },
    address: {
      type: String,
      trim: true,
    },
    hotline: {
      type: String,
      trim: true,
      match: [/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ"], 
    },
    open_time: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ mở cửa phải có định dạng HH:mm"], 
    },
    close_time: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ đóng cửa phải có định dạng HH:mm"],
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

// ================= MODEL =================
const Branch = mongoose.model("branches", branchSchema);

module.exports = Branch;