import apiClient from "../../../services/apiClient";

// --- Products (/api/v1/products) ---

/**
 * Danh sách sản phẩm theo chi nhánh (bắt buộc branch_id)
 * @param {{ branch_id: string, page?: number, limit?: number, type?: string, search?: string }} params
 */
export const getProducts = (params) =>
  apiClient.get("/api/v1/products", { params });

/**
 * Chi tiết sản phẩm
 */
export const getProductById = (id) =>
  apiClient.get(`/api/v1/products/${id}`);

/**
 * Tạo sản phẩm (Admin)
 */
export const createProduct = (data) =>
  apiClient.post("/api/v1/products", data);

/**
 * Cập nhật sản phẩm (Admin)
 */
export const updateProduct = (id, data) =>
  apiClient.put(`/api/v1/products/${id}`, data);

/**
 * Điều chỉnh tồn kho (Admin/Staff)
 * @param {string} id - product id
 * @param {{ change_amount: number, reason: 'restock'|'adjustment'|'refund', note?: string }} data
 */
export const adjustStock = (id, data) =>
  apiClient.post(`/api/v1/products/${id}/adjust-stock`, data);

/**
 * Xóa sản phẩm (Admin)
 */
export const deleteProduct = (id) =>
  apiClient.delete(`/api/v1/products/${id}`);

// --- Orders – thao tác POS trên hóa đơn (/api/v1/orders) ---

export const addPosItems = (orderId, items) =>
  apiClient.post(`/api/v1/orders/${orderId}/pos-items`, { items });

export const updatePosItem = (orderId, data) =>
  apiClient.patch(`/api/v1/orders/${orderId}/pos-items`, data);
