import React,{useEffect,useState} from 'react'
import { getUsers , deleteUser , updateUser } from "../../admin/api/adminApi";


const useAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch users from the API
    const fetchUsers = async () => {
      setIsLoading(true);
        try {
            const response = await getUsers();
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

  return { users, isLoading, fetchUsers }
  
}

export default useAdminUsers
