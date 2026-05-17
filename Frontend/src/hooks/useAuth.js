import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.access_token);

  const [isHydrated, setIsHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? true,
  );

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated?.()) {
      setIsHydrated(true);
      return;
    }

    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      setIsHydrated(true);
    });

    return () => unsub?.();
  }, []);

  const isAuthenticated = !!accessToken;

  return {
    user,
    isAuthenticated,
    isHydrated,
    loading: !isHydrated,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isStaff: user?.role === "staff",
  };
};