import apiClient from "../../../services/apiClient";

// USER


// GET /users/me
export const getMe = () => {
  return apiClient.get("/api/v1/users/me");
};

// PUT /users/me
export const updateMe = (data) => {
  return apiClient.put("/api/v1/users/me", data);
};
