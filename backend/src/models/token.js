const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: false,
    },

    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// TTL index - auto delete khi hết hạn
refreshTokenSchema.index(
  { expires_at: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("refresh_tokens", refreshTokenSchema);