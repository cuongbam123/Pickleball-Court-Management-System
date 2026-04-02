// features/admin/api/adminApi.js
import apiClient from "../../../services/apiClient";

export const adminApi = {
  getDashboardStats: () => apiClient.get("/api/v1/users/dashboard/stats"),
};