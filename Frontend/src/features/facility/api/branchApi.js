import apiClient from "../../../services/apiClient";

export const getBranches = (params) => {
  return apiClient.get("/api/v1/branches", { params });
}

export const getBranchById = (id) => { 
    return apiClient.get(`/api/v1/branches/${id}`); 
}

export const createBranch = (data) => { 
    return apiClient.post("/api/v1/branches", data); 
}

export const updateBranch = (id, data) => { 
    return apiClient.put(`/api/v1/branches/${id}`, data); 
}

export const deleteBranch = (id) => { 
    return apiClient.delete(`/api/v1/branches/${id}`); 
}

