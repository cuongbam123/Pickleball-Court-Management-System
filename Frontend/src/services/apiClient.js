import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// REQUEST
apiClient.interceptors.request.use(
  (config) => {
    const { access_token } = useAuthStore.getState();

    if (access_token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access_token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const { refresh_token, setAccessToken, clearAuth } =
      useAuthStore.getState();

    // Network error
    if (!error.response) {
      toast.error("Không thể kết nối máy chủ, kiểm tra kết nối mạng.");
      return Promise.reject({ message: "Network error" });
    }

    // Không refresh cho chính request refresh để tránh lặp vô hạn
    if (originalRequest?.url?.includes("/auth/refreshToken")) {
      clearAuth();
      return Promise.reject(error);
    }

    const { status } = error.response;

    // 403 – Không có quyền truy cập
    if (status === 403) {
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return Promise.reject(error);
    }

    // 5xx – Lỗi hệ thống
    if (status >= 500) {
      toast.error("Lỗi hệ thống, vui lòng thử lại sau.");
      return Promise.reject(error);
    }

    // Không phải 401 hoặc các endpoint đăng nhập/đăng ký
    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Đang refresh → queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      if (!refresh_token) throw new Error("Missing refresh token");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/refreshToken`,
        { refresh_token },
        { withCredentials: true },
      );

      const newToken =
        res?.data?.data?.access_token ||
        res?.data?.access_token ||
        res?.data?.token;

      if (!newToken) throw new Error("Invalid refresh");

      setAccessToken(newToken);

      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return apiClient(originalRequest);
    } catch (err) {
      processQueue(err, null);

      clearAuth();
      window.location.href = "/login";

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
