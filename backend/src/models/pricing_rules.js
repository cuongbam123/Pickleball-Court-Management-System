const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const pricingRuleSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    court_type: {
      type: String,
      enum: ["2-player", "4-player", "all"],
      required: true,
    },
    day_type: {
      type: String,
      enum: ["weekday", "weekend", "holiday"],
      required: true,
    },
    time_type: {
      type: String,
      enum: ["normal", "golden"],
      required: true,
    },
    start_time: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ phải có định dạng HH:mm"],
    },
    end_time: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ phải có định dạng HH:mm"],
    },
    price_per_hour: {
      type: Number,
      required: true,
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

// Ngăn việc Admin tạo ra 2 rule giống y hệt nhau
// (Nếu sau này bạn thêm branch_id, hãy nhớ cho thêm branch_id: 1 vào đầu index này nhé)
pricingRuleSchema.index(
  {
    court_type: 1,
    day_type: 1,
    time_type: 1,
    start_time: 1,
    end_time: 1,
  },
  { unique: true }
);

// ================= MODEL =================
const PricingRule = mongoose.model("pricing_rules", pricingRuleSchema);

module.exports = PricingRule;