// features/admin/api/adminApi.js
import apiClient from "../../../services/apiClient";

export const adminApi = {
  getDashboardStats: () => apiClient.get("/api/v1/users/dashboard/stats"),
};
// GET /users
export const getUsers = (params) => {
  return apiClient.get("/api/v1/users", { params });
};

// GET /users/:id
export const getUserById = (id) => {
  return apiClient.get(`/api/v1/users/${id}`);
};

// PUT /users/:id
export const updateUser = (id, data) => {
  return apiClient.put(`/api/v1/users/${id}`, data);
};

// PATCH /users/:id/rank
export const updateUserRank = (id, data) => {
  return apiClient.patch(`/api/v1/users/${id}`, data);
};

// DELETE /users/:id
export const deleteUser = (id) => {
  return apiClient.delete(`/api/v1/users/${id}`);
};