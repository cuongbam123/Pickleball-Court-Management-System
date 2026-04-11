import { useState, useEffect } from "react";
// Import đúng tên các hàm bạn đã định nghĩa
import { getBranches, createBranch as apiCreateBranch, updateBranch as apiUpdateBranch, deleteBranch as apiDeleteBranch } from "../api/branchApi";
import { toast } from "react-toastify";

export const useBranches = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const res = await getBranches();
      // Bóc tách data để tránh lỗi nested data
      const actualData = res?.data?.data || res?.data || [];
      setBranches(actualData);
    } catch (error) {
      console.error("Lỗi tải danh sách chi nhánh:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBranch = async (data) => {
    try {
      await apiCreateBranch(data);
      toast.success("Tạo chi nhánh thành công!");
      await fetchBranches();
      return true;
    } catch (error) { return false; }
  };

  const updateBranch = async (id, data) => {
    try {
      await apiUpdateBranch(id, data);
      toast.success("Cập nhật thành công!");
      await fetchBranches();
      return true;
    } catch (error) { return false; }
  };

  const deleteBranch = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) return;
    try {
      await apiDeleteBranch(id);
      toast.success("Xóa thành công!");
      fetchBranches();
    } catch (error) {}
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return { branches, isLoading, createBranch, updateBranch, deleteBranch, refresh: fetchBranches };
};