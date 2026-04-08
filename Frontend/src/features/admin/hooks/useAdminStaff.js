// useAdminStaff.js

import { useState, useEffect } from 'react';
import { getUsers, deleteUser, updateUser } from "../../admin/api/adminApi";
import { getBranchById } from "../../facility/api/branchApi";

const useAdminStaff = () => {
  const [users, setUsers] = useState([]);
  const [branchNames, setBranchNames] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users from the API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getUsers({role : "staff"});
      setUsers(response.data?.data || response.data);
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
      const deletedUserId = response.data?.data?._id || response.data?._id || userId;
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
      setUsers((prev) => prev.map((user) => (user._id === userId ? updatedUser : user)));
      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false };
    }
  };

  return { users, branchNames, isLoading, handleDeleteUser, handleUpdateUser };
};

export default useAdminStaff;