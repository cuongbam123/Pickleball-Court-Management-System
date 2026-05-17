const mongoose = require("mongoose");

const tournamentBracketSchema = new mongoose.Schema(
  {
    tournament_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournaments",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "ongoing", "completed"],
      default: "pending",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

tournamentBracketSchema.index({ tournament_id: 1, is_deleted: 1 });
tournamentBracketSchema.index({ tournament_id: 1, name: 1, is_deleted: 1 });

const TournamentBracket = mongoose.model(
  "tournament_brackets",
  tournamentBracketSchema,
);

module.exports = TournamentBracket;
