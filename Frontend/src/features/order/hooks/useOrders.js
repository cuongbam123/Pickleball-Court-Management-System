import { useCallback, useEffect, useState } from "react";
import { getOrders } from "../api/orderApi";

const cleanParams = (params = {}) => {
  const nextParams = { ...params };

  Object.keys(nextParams).forEach((key) => {
    if (
      nextParams[key] === "" ||
      nextParams[key] === null ||
      nextParams[key] === undefined
    ) {
      delete nextParams[key];
    }
  });

  return nextParams;
};

export const useOrders = (initialFilters = {}, options = {}) => {
  const { enabled = true } = options;
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(
    async (nextFilters = filters, { silent = false } = {}) => {
      if (!enabled) return [];

      try {
        if (silent) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const response = await getOrders(cleanParams(nextFilters));
        const payload = response?.data || {};
        const data = payload?.data || payload || [];

        setOrders(Array.isArray(data) ? data : []);
        setMeta(payload?.meta || null);

        return data;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Khong the tai danh sach hoa don.";
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [enabled, filters],
  );

  useEffect(() => {
    if (!enabled) return;
    fetchOrders();
  }, [enabled, fetchOrders]);

  const updateFilters = useCallback((nextFilters) => {
    setFilters((prev) =>
      typeof nextFilters === "function"
        ? nextFilters(prev)
        : { ...prev, ...nextFilters },
    );
  }, []);

  return {
    orders,
    meta,
    filters,
    setFilters: updateFilters,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchOrders(filters, { silent: true }),
    fetchOrders,
  };
};
