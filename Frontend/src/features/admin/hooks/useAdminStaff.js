// useAdminStaff.js

import { useState, useEffect } from "react";
import {
  getUsers,
  deleteUser,
  updateUser,
  updateUserRank,
} from "../../admin/api/adminApi";
import { getBranchById, getBranches } from "../../facility/api/branchApi";

const useAdminStaff = () => {
  const [users, setUsers] = useState([]);
  const [branchNames, setBranchNames] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  // Fetch users from the API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getUsers({ role: "staff" });
      setUsers(response.data?.data || response.data);
      console.log("Fetched users:", response.data?.data || response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch branch names based on user branch_id
  const fetchBranchNames = async () => {
    const newBranchNames = {};
    for (const user of users) {
      if (user.branch_id) {
        try {
          const res = await getBranchById(user.branch_id);
          const branchData = res.data?.data || res.data;
          newBranchNames[user.branch_id] = branchData?.name || "Không xác định";
        } catch (error) {
          console.error("Error fetching branch name:", error);
        }
      }
    }
    setBranchNames(newBranchNames);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length) {
      fetchBranchNames();
    }
  }, [users]);

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
      if (!rank.skill_rank || !rank.elo_score) {
        throw new Error("Both skill_rank and elo_score are required.");
      }

      const response = await updateUserRank(userId, rank); // Assuming this sends the data correctly
      const updatedUser = response.data?.data || response.data;

      // Update the users state with the updated user data
      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? updatedUser : user)),
      );

      return { success: true };
    } catch (error) {
      console.error("Error updating user rank:", error);
      return { success: false, message: error.message }; // Added message to provide more info in the error response
    }
  };
  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const res = await getBranches(); // Lấy chi nhánh từ API
      const actualData = res?.data?.data || res?.data || [];  // Bóc tách dữ liệu
      setBranches(actualData);  // Lưu dữ liệu chi nhánh vào state
    } catch (error) {
      console.error("Lỗi tải danh sách chi nhánh:", error);
    } finally {
      setIsLoading(false);  // Đặt lại trạng thái loading
    }
  };
  useEffect(() => {
    if (branches.length === 0)
    fetchBranches();
  }, [branches]); 

  return {
    users,
    branchNames,
    isLoading,
    handleDeleteUser,
    handleUpdateUser,
    handleUpdateUserRank,
    branches,
    fetchBranches,
  };
};

export default useAdminStaff;
