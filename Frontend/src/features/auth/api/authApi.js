import apiClient from "../../../services/apiClient";

export const loginApi = (data) => {
  return apiClient.post("/api/v1/auth/login", data);
};

export const registerApi = (data) => {
  return apiClient.post("/api/v1/auth/register", data);
};

export const logoutApi = (refreshToken) => {
  return apiClient.post("/api/v1/auth/logout", { refreshToken });
};