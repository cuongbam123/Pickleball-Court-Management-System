const mongoose = require("mongoose");

const sharedTicketSchema = new mongoose.Schema(
  {
    shared_match_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shared_matches",
      required: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },

    // optional: soft delete
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

// ✅ 1 user chỉ có 1 vé trong 1 match
sharedTicketSchema.index(
  { shared_match_id: 1, user_id: 1 },
  { unique: true }
);

// ✅ query nhanh theo match
sharedTicketSchema.index({ shared_match_id: 1 });

// ✅ query nhanh theo user
sharedTicketSchema.index({ user_id: 1 });

// ✅ query theo trạng thái thanh toán
sharedTicketSchema.index({ payment_status: 1 });
// ================= MODEL =================
const SharedTicket = mongoose.model("shared_tickets", sharedTicketSchema);

module.exports = SharedTicket;