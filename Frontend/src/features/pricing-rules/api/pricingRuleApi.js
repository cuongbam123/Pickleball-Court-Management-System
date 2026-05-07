import apiClient from "../../../services/apiClient";

const BASE_PATH = "/api/v1/pricing-rules";

export const getPricingRules = (params) => apiClient.get(BASE_PATH, { params });

export const getPricingRuleById = (id) => apiClient.get(`${BASE_PATH}/${id}`);

export const createPricingRule = (payload) => apiClient.post(BASE_PATH, payload);

export const updatePricingRule = (id, payload) =>
  apiClient.put(`${BASE_PATH}/${id}`, payload);

export const deletePricingRule = (id) => apiClient.delete(`${BASE_PATH}/${id}`);
