import { useEffect, useState } from "react";
import { getUsers } from "../../admin/api/adminApi";


const useAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users from the API
  const fetchUsers = async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await getUsers(params);
      setUsers(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, isLoading, fetchUsers, setUsers };
};

export default useAdminUsers;
