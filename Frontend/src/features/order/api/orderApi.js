import apiClient from "../../../services/apiClient";

/**
 * Lấy danh sách hóa đơn (Admin/Staff)
 * Có thể lọc theo booking_id, user_id, payment_status thông qua params
 */
export const getOrders = (params) => 
  apiClient.get("/api/v1/orders", { params });

/**
 * Lấy chi tiết hóa đơn theo Order ID
 */
export const getOrder = (id) => 
  apiClient.get(`/api/v1/orders/${id}`);

/**
 * Tạo/lấy hóa đơn cho booking đã đủ điều kiện checkout.
 * Dùng để tự sửa dữ liệu booking cũ của staff/admin chưa có order.
 */
export const ensureOrderByBooking = (bookingId) =>
  apiClient.post(`/api/v1/orders/by-booking/${bookingId}/ensure`);

/**
 * Thanh toán cọc (Tạo URL VNPay cho Deposit)
 */
export const payDeposit = (orderId, data) => 
  apiClient.post(`/api/v1/orders/${orderId}/pay-deposit`, data);

/**
 * Thêm sản phẩm POS vào hóa đơn (Nước uống, dịch vụ...)
 */
export const addPosItems = (orderId, items) => 
  apiClient.post(`/api/v1/orders/${orderId}/pos-items`, { items });

/**
 * Cập nhật số lượng hoặc xóa sản phẩm POS
 */
export const updatePosItem = (orderId, data) => 
  apiClient.patch(`/api/v1/orders/${orderId}/pos-items`, data);

/**
 * Checkout cuối cùng (Tạo URL VNPay cho tổng bill hoặc xác nhận tiền mặt)
 */
export const checkoutOrder = (orderId, data) => 
  apiClient.post(`/api/v1/orders/${orderId}/checkout`, data);
