import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const isAuthenticated = !!accessToken;

  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff",
  };
};