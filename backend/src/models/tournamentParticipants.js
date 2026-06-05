const mongoose = require("mongoose");

const tournamentParticipantSchema = new mongoose.Schema(
  {
    tournament_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournaments",
      required: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "expired", "failed"],
      default: "pending",
    },

    lifecycle: {
      type: String,
      enum: ["reserved", "confirmed", "cancelled", "expired"],
      default: "reserved",
    },

    expires_at: {
      type: Date,
      default: null,
    },

    payment_transaction_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payment_transactions",
      default: null,
    },

    result: {
      type: String,
      enum: ["winner", "runner_up", "participant"],
      default: "participant",
    },

    elo_changed: {
      type: Number,
      default: 0,
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

// ❗ Quan trọng nhất: 1 user chỉ được tham gia 1 lần / giải
tournamentParticipantSchema.index(
  { tournament_id: 1, user_id: 1 },
  { unique: true }
);

// query theo giải
tournamentParticipantSchema.index({ tournament_id: 1 });

// query theo user
tournamentParticipantSchema.index({ user_id: 1 });

// lọc theo payment
tournamentParticipantSchema.index({ payment_status: 1 });

// hỗ trợ worker tìm kiếm các đăng ký hết hạn giữ chỗ
tournamentParticipantSchema.index({ lifecycle: 1, payment_status: 1, expires_at: 1 });

// ================= MODEL =================
const TournamentParticipant = mongoose.model(
  "tournament_participants",
  tournamentParticipantSchema
);

module.exports = TournamentParticipant;