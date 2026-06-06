import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { getRevenueReport, syncRevenue, getTransactions } from "../api/revenueApi";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "react-toastify";

export const useRevenues = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || "customer";
  const userBranchId = user?.branch_id || "";

  // Mặc định khoảng thời gian báo cáo là 7 ngày gần nhất
  const [startDate, setStartDate] = useState(() =>
    dayjs().subtract(6, "day").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(() =>
    dayjs().format("YYYY-MM-DD")
  );
  
  // Đối với staff, khóa cứng chi nhánh của họ. Đối với admin, cho phép chọn tất cả ("")
  const [branchId, setBranchId] = useState(() =>
    userRole === "staff" ? userBranchId : ""
  );

  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- CÁC TRẠNG THÁI DRILL-DOWN 3 CẤP ĐỘ ---
  const [drillDownLevel, setDrillDownLevel] = useState(1); // 1: Main Dashboard, 2: Transaction Log, 3: Detail Drawer
  const [selectedMethod, setSelectedMethod] = useState(null); // 'cash' | 'transfer'
  const [selectedTxn, setSelectedTxn] = useState(null); // Giao dịch đang được chọn để xem chi tiết
  const [transactions, setTransactions] = useState([]); // Chi tiết tất cả giao dịch trong khoảng thời gian lọc
  const [isTxnsLoading, setIsTxnsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsTxnsLoading(true);
    try {
      const params = {
        startDate,
        endDate,
      };
      if (branchId) {
        params.branch_id = branchId;
      }
      const res = await getTransactions(params);
      const data = res?.data?.data || res?.data || [];
      setTransactions(data);
    } catch (error) {
      console.error("Lỗi tải danh sách giao dịch:", error);
      toast.error(error?.response?.data?.message || "Không thể tải danh sách giao dịch dòng tiền");
    } finally {
      setIsTxnsLoading(false);
    }
  }, [startDate, endDate, branchId]);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        startDate: startDate,
        endDate: endDate,
      };
      
      if (branchId) {
        params.branch_id = branchId;
      }

      const res = await getRevenueReport(params);
      const actualData = res?.data?.data || res?.data || [];
      setReportData(actualData);

      // Tải danh sách giao dịch dòng tiền song song
      await fetchTransactions();
    } catch (error) {
      console.error("Lỗi tải báo cáo doanh thu:", error);
      toast.error(error?.response?.data?.message || "Không thể tải báo cáo doanh thu");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, branchId, fetchTransactions]);

  const triggerSync = async (dateStr) => {
    if (!dateStr) return;
    setIsSyncing(true);
    try {
      await syncRevenue({ date: dateStr });
      toast.success(`Đồng bộ hóa dữ liệu ngày ${dateStr} thành công!`);
      // Tải lại báo cáo
      await fetchReport();
      return true;
    } catch (error) {
      console.error("Lỗi đồng bộ doanh thu:", error);
      toast.error(error?.response?.data?.message || "Đồng bộ hóa doanh thu thất bại");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Chỉ tự động tải nếu là admin hoặc staff (có quyền truy cập)
    if (["admin", "staff", "manager"].includes(userRole)) {
      fetchReport();
    }
  }, [fetchReport, userRole]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    branchId,
    setBranchId,
    reportData,
    isLoading,
    isSyncing,
    triggerSync,
    refresh: fetchReport,
    userRole,
    userBranchId,
    
    // Drill-down states & actions
    drillDownLevel,
    setDrillDownLevel,
    selectedMethod,
    setSelectedMethod,
    selectedTxn,
    setSelectedTxn,
    transactions,
    isTxnsLoading,
    fetchTransactions,
  };
};
