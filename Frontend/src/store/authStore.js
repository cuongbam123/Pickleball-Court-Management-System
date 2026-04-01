import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,

      isRefreshing: false,

      setAuth: ({ user, access_token, refresh_token }) => {
        if (!user || !access_token) return;

        set({
          user,
          access_token,
          refresh_token,
        });
      },

      clearAuth: () =>
        set({
          user: null,
          access_token: null,
          refresh_token: null,
        }),

      setAccessToken: (token) =>
        set({
          access_token: token,
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
