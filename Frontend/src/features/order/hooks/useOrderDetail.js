import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrder } from "../api/orderApi";

export const getOrderTotals = (order) => {
  const courtFee = Number(order?.total_court_fee || 0);
  const posFee = Number(order?.total_pos_fee || order?.total_pos_amount || 0);
  const deposit = Number(order?.deposit_paid || 0);
  const totalBill = courtFee + posFee;
  const remainingBalance = Math.max(
    Number(order?.final_amount_due ?? totalBill - deposit),
    0,
  );

  const posItems = (order?.order_items || []).map((item) => ({
    ...item,
    name: item.name || item.name_snapshot,
    price: item.price ?? item.unit_price_snapshot,
    total_amount:
      item.total_amount ??
      Number(item.unit_price_snapshot || item.price || 0) *
        Number(item.quantity || 0),
  }));

  return {
    courtFee,
    posFee,
    deposit,
    totalBill,
    remainingBalance,
    posItems,
  };
};

export const useOrderDetail = (orderId, options = {}) => {
  const { enabled = true } = options;
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && orderId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled || !orderId) return null;

      try {
        if (silent) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const response = await getOrder(orderId);
        const data = response?.data?.data || response?.data || null;

        setOrder(data);
        return data;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Khong the tai chi tiet hoa don.";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [enabled, orderId],
  );

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const totals = useMemo(() => getOrderTotals(order), [order]);

  return {
    order,
    setOrder,
    ...totals,
    isLoading,
    isRefreshing,
    error,
    refreshOrder: () => fetchOrder({ silent: true }),
    fetchOrder,
  };
};
