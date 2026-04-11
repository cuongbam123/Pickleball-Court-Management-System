const cron = require("node-cron");
const Booking = require("../models/bookings");

const expireBookingsJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const expiredBookings = await Booking.find({
        status: "holding",
        expires_at: { $lt: new Date() },
      });

      // Cập nhật các booking hết hạn thành 'cancelled'
      for (const booking of expiredBookings) {
        booking.status = "cancelled"; 
        booking.cancelled_by = "system"; 
        await booking.save(); 

        if (booking.cancelled_by === "system") {
          await Booking.deleteOne({ _id: booking._id }); 
          console.log(`Booking ${booking._id} đã bị hủy và xóa do hệ thống.`);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chạy cron job expireBookingsJob:", error);
    }
  });
};

module.exports = expireBookingsJob;
