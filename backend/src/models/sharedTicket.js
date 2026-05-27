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
    ticket_price: {
      type: Number,
      required: true,
      min: 0,
    },
    paid_amount: {
      type: Number,
      min: 0,
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    expires_at: {
      type: Date,
      default: null,
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
  },
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

// ✅ query theo trạng thái thanh toán và thời gian hết hạn (để tự động hủy vé khi hết hạn)

sharedTicketSchema.index({ payment_status: 1, expires_at: 1 });


// ================= MODEL =================
const SharedTicket = mongoose.model("shared_tickets", sharedTicketSchema);

module.exports = SharedTicket;
