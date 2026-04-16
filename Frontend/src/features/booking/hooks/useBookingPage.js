import { useState, useEffect, useCallback } from "react";
import { getBranches } from "../../facility/api/branchApi";
import { getAllCourts, getCourtsByBranch } from "../../facility/api/courtApi";
import { useAuthStore } from "../../../store/authStore"; // Lấy thông tin user đăng nhập

export const useBookingPage = () => {
  // Lấy thông tin user đang đăng nhập từ Zustand
  const { user } = useAuthStore();

  // Danh mục Filter
  const [branches, setBranches] = useState([]);
  const [courtsList, setCourtsList] = useState([]); // List sân dùng cho State 1 & 2
  
  // State quản lý Filter
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
const [selectedSlots, setSelectedSlots] = useState([]); 
  const [isLoadingCourts, setIsLoadingCourts] = useState(false);

  // 1. Load danh sách chi nhánh ban đầu
  useEffect(() => {
    getBranches().then((res) => {
      setBranches(res?.data?.data || res?.data || []);
    });
  }, []);

  // 2. Xử lý logic T1 & T2: Load danh sách sân dựa theo selectedBranch
  const fetchCourts = useCallback(async () => {
    setIsLoadingCourts(true);
    try {
      if (!selectedBranch) {
        // T1: Chưa chọn chi nhánh -> Load TẤT CẢ sân
        const res = await getAllCourts({ limit: 100 });
        setCourtsList(res?.data?.data || res?.data || []);
      } else {
        // T2: Đã chọn chi nhánh -> Load sân của chi nhánh đó
        const res = await getCourtsByBranch(selectedBranch);
        setCourtsList(res?.data?.data || res?.data || []);
      }
    } catch (error) {
      console.error("Lỗi fetch sân:", error);
    } finally {
      setIsLoadingCourts(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchCourts();
    // Mỗi khi đổi chi nhánh, reset lại sân đã chọn để quay về màn hình List Sân (T2)
    setSelectedCourt("");
    setSelectedSlots([]);
  }, [fetchCourts, selectedBranch]);

  // Handle khi click vào slot (T4)
  const handleSelectSlot = (court, slot) => {
    setSelectedSlots((prev) => {
      // 1. Tạo object userInfo lấy từ state user đang đăng nhập
      const userInfo = {
        name: user?.full_name || user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
      };

      // 2. Nếu click sang một Sân khác -> Xóa hết chọn lại từ đầu
      if (prev.length > 0 && prev[0].courtId !== court._id) {
        return [{ ...slot, courtId: court._id, userInfo }]; // THÊM userInfo VÀO ĐÂY
      }

      // 3. Nếu click vào ô đã chọn rồi -> Bỏ chọn (Deselect)
      const isExists = prev.find(s => s.startTime === slot.startTime);
      if (isExists) {
        const removed = prev.filter(s => s.startTime !== slot.startTime);
        // Kiểm tra xem mảng còn lại có liên tiếp không, nếu bị đứt đoạn thì xóa sạch
        const isValid = removed.every((s, i) => i === 0 || removed[i-1].endTime === s.startTime);
        return isValid ? removed : []; 
      }

      // 4. Thêm ô mới vào và sắp xếp theo thời gian
      const added = [...prev, { ...slot, courtId: court._id, userInfo }].sort((a, b) => 
        a.startTime.localeCompare(b.startTime) // THÊM userInfo VÀO ĐÂY
      );

      // 5. Kiểm tra tính liên tiếp (VD: 17:00-18:00 phải đi liền với 18:00-19:00)
      const isContiguous = added.every((s, i) => i === 0 || added[i-1].endTime === s.startTime);
      
      // Nếu nhảy cóc -> Xóa hết, chỉ chọn ô vừa click
      if (!isContiguous) {
        return [{ ...slot, courtId: court._id, userInfo }]; // THÊM userInfo VÀO ĐÂY
      }

      return added;
    });
  };

  return {
    user,
    branches,
    courtsList,
    selectedBranch,
    setSelectedBranch,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    setSelectedSlots,
    isLoadingCourts,
    handleSelectSlot
  };
};