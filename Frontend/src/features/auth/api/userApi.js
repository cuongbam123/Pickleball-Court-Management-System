import apiClient from "../../../services/apiClient";

// USER
// GET /users
export const getUsers = (params) => {
  return apiClient.get("/api/v1/users/getUsers", { params });
};

// GET /users/:id
export const getUserById = (id) => {
  return apiClient.get(`/api/v1/users/getUserById/${id}`);
};

// PUT /users/:id
export const updateUser = (id, data) => {
  return apiClient.put(`/api/v1/users/updateUser/${id}`, data);
};

// PATCH /users/:id/rank
export const updateUserRank = (id, data) => {
  return apiClient.patch(`/api/v1/users/updateUserRank/${id}`, data);
};

// DELETE /users/:id
export const deleteUser = (id) => {
  return apiClient.delete(`/api/v1/users/deleteUser/${id}`);
};

// GET /users/me
export const getMe = () => {
  return apiClient.get("/api/v1/users/me");
};

// PUT /users/me
export const updateMe = (data) => {
  return apiClient.put("/api/v1/users/me", data);
};

//ADMIN

// GET /users/dashboard/stats
export const getDashboardStats = () => {
  return apiClient.get("/api/v1/users/dashboard/stats");
};