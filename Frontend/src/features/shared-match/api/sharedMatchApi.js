import apiClient from "../../../services/apiClient";

export const getSharedMatches = (params) =>
    apiClient.get("/api/v1/shared-matches", { params });
export const getSharedMatchById = (id) => 
    apiClient.get(`/api/v1/shared-matches/${id}`);
export const getShareTicket = (id) =>
    apiClient.get(`/api/v1/shared-matches/${id}/tickets`);
export const buySharedMatchTicket = (id, ticketData) =>
    apiClient.post(`/api/v1/shared-matches/${id}/tickets`, ticketData);