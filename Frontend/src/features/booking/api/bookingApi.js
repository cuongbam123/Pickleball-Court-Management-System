import apiClient from "../../../services/apiClient";

export const getAllBookings = (params) =>
    apiClient.get("/api/v1/bookings", { params});
export const getBookings = (id) =>
    apiClient.get(`/api/v1/bookings/${id}`);
export const createBooking = (data) =>
    apiClient.post("/api/v1/bookings/hold", data);
export const updateBooking = (id, data) =>
    apiClient.patch(`/api/v1/bookings/${id}/status`, data);
export const cancelBooking = (id, data) =>
    apiClient.patch(`/api/v1/bookings/${id}/cancel`, data);
export const payBooking = (id, data) =>
    apiClient.post(`/api/v1/bookings/${id}/pay-deposit`, data);
export const getAvaliableTimeSlots = (params) =>
    apiClient.get("/api/v1/bookings/avaliable", { params });

