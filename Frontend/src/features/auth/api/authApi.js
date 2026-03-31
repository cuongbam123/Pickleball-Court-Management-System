import apiClient from "../../../services/apiClient";

export const loginApi = (data) => {
  return apiClient.post("/api/v1/auth/login", data);
};

export const registerApi = (data) => {
  return apiClient.post("/api/v1/auth/register", data);
};

export const logoutApi = (refresh_token) => {
  return apiClient.post("/api/v1/auth/logout", { refresh_token });
};