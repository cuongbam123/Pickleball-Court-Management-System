const cron = require("node-cron");
const { toZonedTime, format } = require("date-fns-tz");
const reportService = require("../services/reportService");
const RevenueByDay = require("../models/revenueByDay");

const TIMEZONE = "Asia/Ho_Chi_Minh";

const revenueAggregationJob = () => {
  // Tự động rà soát, xóa và tính toán lại dữ liệu doanh thu 7 ngày qua khi khởi động server
  const syncRecentDays = async () => {
    try {
      console.log("[revenueAggregationJob] Khởi động: Đang rà soát và cập nhật dữ liệu doanh thu 7 ngày gần nhất...");
      const today = new Date();
      const zonedNow = toZonedTime(today, TIMEZONE);
      
      for (let i = 7; i >= 1; i--) {
        const checkDate = new Date(zonedNow.getTime() - i * 24 * 60 * 60 * 1000);
        const checkDateStr = format(checkDate, "yyyy-MM-dd", { timeZone: TIMEZONE });
        
        // Xóa bản ghi cũ của ngày này để đảm bảo dữ liệu được cập nhật mới nhất từ các giao dịch thực tế
        await RevenueByDay.deleteMany({ date: checkDateStr });
        console.log(`[revenueAggregationJob] Đang đồng bộ lại dữ liệu doanh thu ngày ${checkDateStr}...`);
        await reportService.aggregateAndSaveRevenue(checkDateStr);
      }
      console.log("[revenueAggregationJob] Hoàn tất rà soát và đồng bộ lại dữ liệu 7 ngày gần nhất.");
    } catch (error) {
      console.error("[revenueAggregationJob] Lỗi khi chạy tự động bù đắp và đồng bộ dữ liệu doanh thu:", error);
    }
  };

  syncRecentDays();

  // Chạy lúc 00:01 hàng ngày theo múi giờ Việt Nam
  cron.schedule(
    "1 0 * * *",
    async () => {
      try {
        console.log("[revenueAggregationJob] Bắt đầu tổng hợp doanh thu ngày hôm trước...");
        
        // Lấy ngày hôm qua dưới định dạng YYYY-MM-DD theo múi giờ Việt Nam
        const now = new Date();
        const zonedNow = toZonedTime(now, TIMEZONE);
        const yesterday = new Date(zonedNow.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = format(yesterday, "yyyy-MM-dd", { timeZone: TIMEZONE });

        await reportService.aggregateAndSaveRevenue(yesterdayStr);
        console.log(`[revenueAggregationJob] Hoàn thành tự động tổng hợp doanh thu ngày hôm trước (${yesterdayStr}).`);
      } catch (error) {
        console.error("Lỗi khi chạy cron job revenueAggregationJob:", error);
      }
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );
};

module.exports = revenueAggregationJob;
