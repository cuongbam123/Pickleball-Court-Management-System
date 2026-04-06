import { useState, useEffect, useCallback } from "react";
import { getBranches } from "../api/branchApi";
// Nhớ import thêm getAllCourts
import { getAllCourts, createCourt as apiCreateCourt, updateCourt as apiUpdateCourt, deleteCourt as apiDeleteCourt, changeCourtStatus } from "../api/courtApi";
import { toast } from "react-toastify";

// Truyền filters vào hook để Backend tự lọc
export const useCourts = (filters = {}) => {
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);

  // Dùng useCallback để tránh render vòng lặp vô hạn khi filters thay đổi
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Lấy list chi nhánh (để đổ vào dropdown filter và modal)
      const branchRes = await getBranches();
      setBranches(branchRes?.data?.data || branchRes?.data || []);

      // 2. Gọi API lấy TẤT CẢ sân, ném luôn bộ lọc xuống cho Backend lo
      const courtRes = await getAllCourts({ 
        limit: 100, 
        ...filters 
      });
      
      const allCourts = courtRes?.data?.data || courtRes?.data || [];

      // 3. Map lại data vì Backend trả branch_id là 1 object 
      const mappedCourts = allCourts.map(court => ({
        ...court,
        branch_name: court.branch_id?.name || "Không rõ",
        branch_id: court.branch_id?._id || court.branch_id
      }));

      setCourts(mappedCourts);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu sân:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters.branch_id]); 

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const createCourt = async (branchId, data) => {
    try {
      await apiCreateCourt(branchId, data);
      toast.success("Thêm sân mới thành công!");
      await fetchAllData();
      return true;
    } catch (error) { return false; }
  };

  const updateCourt = async (id, data) => {
    try {
      await apiUpdateCourt(id, data);
      toast.success("Cập nhật sân thành công!");
      await fetchAllData();
      return true;
    } catch (error) { return false; }
  };

  const deleteCourt = async (id) => {
    if (!window.confirm("Xác nhận xóa sân này?")) return;
    try {
      await apiDeleteCourt(id);
      toast.success("Đã xóa sân!");
      await fetchAllData();
    } catch (error) {}
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "maintenance" : "active";
    try {
      await changeCourtStatus(id, newStatus);
      toast.success(`Đã chuyển sang ${newStatus === 'active' ? 'hoạt động' : 'bảo trì'}`);
      await fetchAllData();
    } catch (error) {}
  };

  return { courts, branches, isLoading, createCourt, updateCourt, deleteCourt, toggleStatus, refresh: fetchAllData };
};