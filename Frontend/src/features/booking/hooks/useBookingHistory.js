import { useState, useEffect, useCallback } from "react";
import { getBranches } from "../../facility/api/branchApi";
import { getAllCourts, getCourtsByBranch } from "../../facility/api/courtApi";
import {
  getAllBookings,
  updateBooking,
  cancelBooking,
  getBookings,
} from "../api/bookingApi";
import { useAuthStore } from "../../../store/authStore";

const useBookingHistory = (initialFilters = {}) => {
  const { user } = useAuthStore();
  const userRole = user?.role;
  const userId = user?._id || user?.id;
  //user.branch

  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    date: "",
    branch_id: "",
    court_id: "",
    ...initialFilters,
  });
  const [branches, setBranches] = useState([]);
  const [courtsList, setCourtsList] = useState([]);

  useEffect(() => {
    const fetchMasterBranches = async () => {
      try {
        const res = await getBranches();
        setBranches(res?.data?.data || res?.data || []);
      } catch (err) {
        console.error("Lỗi tải danh sách chi nhánh:", err);
      }
    };
    fetchMasterBranches();
  }, []);

  // Effect 2: Lấy danh sách Sân (Chạy lại mỗi khi filters.branch_id thay đổi)
  useEffect(() => {
    const fetchDynamicCourts = async () => {
      try {
        let res;
        // Nếu đang chọn 1 chi nhánh cụ thể -> Gọi API lấy sân theo chi nhánh đó
        if (filters.branch_id) {
          res = await getCourtsByBranch(filters.branch_id);
        }
        // Nếu để trống (Tất cả chi nhánh) -> Gọi API lấy tất cả sân
        else {
          res = await getAllCourts();
        }
        setCourtsList(res?.data?.data || res?.data || []);

        // Optional: Tự động reset court_id về rỗng nếu người dùng đổi chi nhánh
        // Để tránh lỗi đang chọn "Sân A của Chi nhánh 1" mà lại chuyển sang "Chi nhánh 2"
        setFilters((prev) => ({ ...prev, court_id: "" }));
      } catch (err) {
        console.error("Lỗi tải danh sách sân:", err);
      }
    };
    fetchDynamicCourts();
  }, [filters.branch_id]);
  // 3. LOGIC GỌI API LẤY DANH SÁCH
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Khởi tạo params từ các bộ lọc trên giao diện (ngày, trạng thái...)
      const finalParams = { ...filters };

      // NẾU LÀ CUSTOMER: Ép cứng thêm ID của họ vào params để Backend lọc
      if (userRole === "customer" && userId) {
        finalParams.user_id = userId; // Chú ý: Hỏi Backend xem họ dùng tên biến là 'user_id' hay 'customer_id' nhé
      }

      Object.keys(finalParams).forEach((key) => {
        if (
          finalParams[key] === "" ||
          finalParams[key] === null ||
          finalParams[key] === undefined
        ) {
          delete finalParams[key];
        }
      });
      // Gọi chung 1 hàm duy nhất
      const response = await getAllBookings(finalParams);

      const data = response?.data?.data || response?.data || [];

      const statusPriority = {
        pending_deposit: 1, 
        deposited: 2,      
        playing: 3,         
        completed: 4,       
        cancelled: 5       
      };

      data.sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;

        if (priorityA !== priorityB) {
           return priorityA - priorityB; 
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setHistoryData(data);
    } catch (err) {
      console.error("Lỗi khi fetch lịch sử:", err);
      if (err.message === "Network Error") {
        setError("Không thể kết nối đến máy chủ.");
      } else {
        setError(
          err?.response?.data?.message || "Không thể tải danh sách lịch sử.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, userRole, userId]);

  // Chạy hàm fetchHistory 1 lần khi trang vừa load xong
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 4. CÁC HÀM TIỆN ÍCH (Action)
  const changeBookingStatus = async (bookingId, newStatus) => {
    try {
      await updateBooking(bookingId, { status: newStatus });
      await fetchHistory(); // Thành công thì load lại danh sách
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Lỗi cập nhật.",
      };
    }
  };

  const handleCancelBooking = async (bookingId, cancelReason = "") => {
    try {
      const payload = {
        reason: cancelReason,
        cancelled_by: userId,
      };
      await cancelBooking(bookingId, payload);
      await fetchHistory();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Lỗi khi hủy đơn.",
      };
    }
  };

  // 5. TRẢ VỀ CHO GIAO DIỆN SỬ DỤNG
  return {
    historyData,
    isLoading,
    error,
    filters,
    branches, 
    courtsList,
    setFilters,
    changeBookingStatus,
    handleCancelBooking,
    refresh: fetchHistory,
  };
};

export default useBookingHistory;
