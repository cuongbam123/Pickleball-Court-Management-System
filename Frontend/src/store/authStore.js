import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      isRefreshing: false,

      setAuth: ({ user, accessToken, refreshToken }) => {
        if (!user || !accessToken) return;

        set({
          user,
          accessToken,
          refreshToken,
        });
      },

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),

      setAccessToken: (token) =>
        set({
          accessToken: token,
        }),

      setRefreshing: (value) =>
        set({
          isRefreshing: value,
        }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
