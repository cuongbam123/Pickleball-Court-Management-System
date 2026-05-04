const cron = require("node-cron");
const Booking = require("../models/bookings");

const expireBookingsJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const result = await Booking.updateMany(
        {
          status: "holding",
          expires_at: { $lt: now },
        },
        {
          $set: {
            status: "cancelled",
            cancelled_by: "system",
            cancel_at: now,
            hold_token: null,
            hold_owner: null,
            expires_at: null,
          },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[expireBookingsJob] Đã tự động hủy ${result.modifiedCount} booking giữ chỗ quá hạn.`,
        );
      }
    } catch (error) {
      console.error("Lỗi khi chạy cron job expireBookingsJob:", error);
    }
  });
};

module.exports = expireBookingsJob;
