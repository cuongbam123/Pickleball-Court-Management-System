const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    required_rank: {
      type: String,
      enum: ["D", "C", "B", "A"],
      required: true,
    },
    entry_fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    max_participants: {
      type: Number,
      required: true,
      min: 2,
    },
    current_participants: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["open_registration", "ongoing", "completed"],
      default: "open_registration",
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
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

// Tìm kiếm theo trạng thái giải đấu
tournamentSchema.index({ status: 1 });

// Lọc giải đấu theo trình độ (Rank)
tournamentSchema.index({ required_rank: 1 });

// Tìm giải đấu theo chi nhánh (thường user muốn xem giải mới nhất của cơ sở)
tournamentSchema.index({ branch_id: 1, createdAt: -1 });

// Query danh sách giải theo khoảng thời gian diễn ra
tournamentSchema.index({ start_date: 1, end_date: 1 });

// Tìm kiếm theo tên giải
tournamentSchema.index({ name: 1 });

// ================= MODEL =================
const Tournament = mongoose.model("tournaments", tournamentSchema);

module.exports = Tournament;