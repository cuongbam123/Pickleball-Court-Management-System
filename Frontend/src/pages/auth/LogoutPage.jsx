import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logoutApi } from "../../features/auth/api/authApi";
import { useAuthStore } from "../../store/authStore";

const LogoutPage = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refresh_token = useAuthStore((s) => s.refresh_token);
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;

    const handleLogout = async () => {
      try {
        if (!refresh_token) {
          throw new Error("Không tìm thấy refresh_token");
        }

        await logoutApi(refresh_token);
      } catch (err) {
        console.error("LOGOUT ERROR:", err.response?.data || err);
      } finally {
        clearAuth();
        navigate("/login", { replace: true });
      }
    };

    handleLogout();
  }, [refresh_token, clearAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
      Đang đăng xuất...
    </div>
  );
};

export default LogoutPage;