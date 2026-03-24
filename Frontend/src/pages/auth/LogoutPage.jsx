import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutApi } from "../../features/auth/api/authApi";
import { useAuthStore } from "../../store/authStore";

const LogoutPage = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logoutApi();
      } catch (err) {
        console.error("LOGOUT ERROR:", err);
      } finally {
        clearAuth();
        navigate("/login", { replace: true });
      }
    };

    handleLogout();
  }, [clearAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
         Đang đăng xuất...
    </div>

  );
};

export default LogoutPage;