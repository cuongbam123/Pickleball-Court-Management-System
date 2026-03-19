const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const sharedMatchSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bookings",
      required: true,
      unique: true, // 1 booking chỉ tạo 1 sân ghép (Tự động tạo index)
    },
    status: {
      type: String,
      enum: ["recruiting", "locked", "completed", "cancelled"],
      default: "recruiting",
    },
    ticket_price: {
      type: Number,
      required: true,
      min: 0,
    },
    max_slots: {
      type: Number,
      default: 10,
      min: 1,
    },
    booked_slots: {
      type: Number,
      default: 0,
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

// ================= INDEX =================

// Đánh index để tăng tốc độ tìm kiếm danh sách sân ghép đang tuyển người
// (Thường user sẽ muốn xem các sân đang "recruiting" và mới nhất)
sharedMatchSchema.index({ status: 1, createdAt: -1 });

// ================= MODEL =================
const SharedMatch = mongoose.model("shared_matches", sharedMatchSchema);

module.exports = SharedMatch;