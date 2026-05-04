// useAdminStaff.js

import { useState, useEffect } from "react";
import {
  getUsers,
  deleteUser,
  updateUser,
  updateUserRank,
  createStaffAccount,
} from "../../admin/api/adminApi";
import { getBranches } from "../../facility/api/branchApi";

const useAdminStaff = () => {
  const [users, setUsers] = useState([]);
  const [branchNames, setBranchNames] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState([]);

  const fetchUsers = async (params = { role: "staff" }) => {
    setIsLoading(true);
    try {
      const response = await getUsers(params);
      setUsers(response.data?.data || response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      const response = await deleteUser(userId);
      const deletedUserId =
        response.data?.data?._id || response.data?._id || userId;
      setUsers((prev) => prev.filter((user) => user._id !== deletedUserId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false };
    }
  };

  const handleUpdateUser = async (userId, formData) => {
    try {
      const response = await updateUser(userId, formData);
      const updatedUser = response.data?.data || response.data;
      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? updatedUser : user)),
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false };
    }
  };
  const handleUpdateUserRank = async (userId, rank) => {
    try {
      if (!rank.elo_score) {
        throw new Error("elo_score là bắt buộc");
      }

      const response = await updateUserRank(userId, {
        skill_rank: rank.skill_rank || "D",
        elo_score: Number(rank.elo_score),
      });
      const updatedUser = response.data?.data || response.data;

      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? updatedUser : user)),
      );

      return { success: true };
    } catch (error) {
      console.error("Error updating user rank:", error);
      return {
        success: false,
        message: error?.response?.data?.message || error.message,
      };
    }
  };

  const handleCreateStaff = async (formData) => {
    try {
      const response = await createStaffAccount(formData);
      const createdUser = response.data?.data || response.data;
      setUsers((prev) => [createdUser, ...prev]);
      return { success: true, data: createdUser };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || "Không thể tạo nhân viên",
      };
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await getBranches();
      const actualData = res?.data?.data || res?.data || [];
      setBranches(actualData);
      const namesMap = actualData.reduce((acc, branch) => {
        acc[branch._id] = branch.name;
        return acc;
      }, {});
      setBranchNames(namesMap);
    } catch (error) {
      console.error("Lỗi tải danh sách chi nhánh:", error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return {
    users,
    branchNames,
    isLoading,
    handleDeleteUser,
    handleUpdateUser,
    handleUpdateUserRank,
    handleCreateStaff,
    branches,
    fetchBranches,
    fetchUsers,
  };
};

export default useAdminStaff;
