import apiClient from "../../../services/apiClient";

/**
 * Lấy báo cáo doanh thu theo chi nhánh và khoảng thời gian
 * @param {object} params Các bộ lọc { startDate, endDate, branch_id }
 */
export const getRevenueReport = (params) => {
  return apiClient.get("/api/v1/reports/daily-revenue", { params });
};

/**
 * Kích hoạt đồng bộ hóa doanh thu thủ công cho 1 ngày cụ thể
 * @param {object} data { date: "YYYY-MM-DD" }
 */
export const syncRevenue = (data) => {
  return apiClient.post("/api/v1/reports/sync", data);
};

/**
 * Lấy danh sách giao dịch chi tiết phục vụ báo cáo dòng tiền
 * @param {object} params Các bộ lọc { startDate, endDate, branch_id, payment_method }
 */
export const getTransactions = (params) => {
  return apiClient.get("/api/v1/reports/transactions", { params });
};
