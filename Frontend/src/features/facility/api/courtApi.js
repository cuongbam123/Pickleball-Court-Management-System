// features/facility/api/courtApi.js
import apiClient from "../../../services/apiClient";

export const getAllCourts = (params) => apiClient.get("/api/v1/courts", { params });
export const getCourtsByBranch = (branchId) =>
  apiClient.get(`/api/v1/branches/${branchId}/courts`);
export const createCourt = (branchId, data) =>
  apiClient.post(`/api/v1/branches/${branchId}/courts`, data);
export const getCourtById = (id) => apiClient.get(`/api/v1/courts/${id}`);
export const updateCourt = (id, data) =>
  apiClient.put(`/api/v1/courts/${id}`, data);
export const changeCourtStatus = (id, status) =>
  apiClient.patch(`/api/v1/courts/${id}/status`, { status });
export const deleteCourt = (id) => apiClient.delete(`/api/v1/courts/${id}`);
export const toggleCourtTagStatus = (id, tagStatus) =>
  apiClient.patch(`/api/v1/courts/${id}/tagstatus`, { tagStatus });
