const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    court_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courts",
      required: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    buffer_time: {
      type: Number,
      default: 0,
      min: 0,
    },
    booking_type: {
      type: String,
      enum: ["standard", "shared_match"],
      default: "standard",
    },
    status: {
      type: String,
      enum: ["holding", "deposited", "playing", "completed", "cancelled"],
      default: "holding",
    },
    deposit_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    total_court_price: {
      type: Number,
      required: true,
      min: 0,
    },
    hold_token: {
      type: String,
      default: null,
    },
    hold_owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    cancelled_by: {
      type: mongoose.Schema.Types.Mixed, // Có thể là ObjectId (người dùng/admin) hoặc String ('system')
      default: null,
    },
    cancel_at: {
      type: Date,
      default: null,
    },
    refund_status: {
      type: String,
      enum: ["none", "pending", "refunded"],
      default: "none",
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

// --- INDEXES CẤP DATABASE ---
// Phục vụ check trùng lịch
bookingSchema.index({ court_id: 1, start_time: 1, end_time: 1 });

// Lọc lịch theo chi nhánh
bookingSchema.index({ branch_id: 1, start_time: 1 });

// Lấy lịch sử đặt sân của user
bookingSchema.index({ user_id: 1, createdAt: -1 });

// Hỗ trợ Worker/TTL quét booking hết hạn giữ chỗ
bookingSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 600,
    partialFilterExpression: { status: "holding" },
  }
);

const Booking = mongoose.model("Bookings", bookingSchema);

module.exports = Booking;