// features/admin/hooks/useAdminDashboard.js
import { useState, useEffect } from "react";
import { adminApi } from "../api/adminApi";

export const useAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminApi.getDashboardStats();
      const actualData = response?.data?.data || response?.data;
      setStats(actualData);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải dữ liệu thống kê",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, isLoading, error, refetch: fetchStats };
};
