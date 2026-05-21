import apiClient from "../../../services/apiClient";

/**
 * Kiểm tra trạng thái thanh toán
 * @param {string} txnRef - Mã giao dịch (bookingId hoặc O_orderId)
 * @param {object} vnpayParams - Toàn bộ query params nhận được từ VNPay URL
 */
export const checkPaymentStatus = async (txnRef, vnpayParams = {}) => {
  try {
    // Sử dụng chính apiClient để tự động đính kèm Token/Header
    const response = await apiClient.get(`/api/v1/payments/status/${txnRef}`, {
      params: vnpayParams,
    });

    // Axios trả về dữ liệu trong field .data
    return response.data;
  } catch (error) {
    // Đẩy lỗi ra để Hook xử lý (error.response.data.message)
    throw error;
  }
};

/**
 * Tạo link thanh toán cọc
 */
export const createDepositPaymentUrl = (bookingId, data) =>
  apiClient.post(`/api/v1/bookings/${bookingId}/pay-deposit`, data);