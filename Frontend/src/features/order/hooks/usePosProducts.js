import { useState, useEffect, useCallback } from "react";
import { getProducts } from "../../pos/api/posApi";

/**
 * Danh sách sản phẩm POS theo chi nhánh (dùng tại quầy checkout)
 */
export const usePosProducts = (branchId, { enabled = true } = {}) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const fetchProducts = useCallback(async () => {
    if (!branchId || !enabled) {
      setProducts([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getProducts({
        branch_id: branchId,
        limit: 100,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(type ? { type } : {}),
      });

      setProducts(response?.data?.data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Không thể tải danh sách sản phẩm.";
      setError(msg);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [branchId, enabled, search, type]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    search,
    setSearch,
    type,
    setType,
    refreshProducts: fetchProducts,
  };
};
