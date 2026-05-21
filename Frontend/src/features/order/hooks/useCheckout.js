import { useCallback, useMemo, useRef, useState } from "react";
import { checkoutOrder } from "../api/orderApi";
import { getOrderTotals } from "./useOrderDetail";
import { usePayment } from "./usePayment";

const COUNTER_METHODS = ["cash", "transfer"];
const ONLINE_METHODS = ["vnpay", "paypal"];

export const useCheckout = (order, options = {}) => {
  const { onSuccess, onError } = options;
  const submittingRef = useRef(false);
  const payment = usePayment(order, options.payment || {});
  const { redirectToPayment } = payment;
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [optimisticOrder, setOptimisticOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const totals = useMemo(() => getOrderTotals(order), [order]);

  const validateCheckout = useCallback(
    ({ paymentMethod = "cash", amountReceived = 0 } = {}) => {
      if (!order?._id) {
        return { valid: false, message: "Chua co hoa don de checkout." };
      }

      if (order.payment_status === "fully_paid") {
        return { valid: false, message: "Hoa don da duoc thanh toan." };
      }

      if (![...COUNTER_METHODS, ...ONLINE_METHODS].includes(paymentMethod)) {
        return {
          valid: false,
          message: "Phuong thuc thanh toan khong hop le.",
        };
      }

      if (
        paymentMethod === "cash" &&
        Number(amountReceived) < totals.remainingBalance
      ) {
        return {
          valid: false,
          message: "So tien khach dua chua du de thanh toan.",
        };
      }

      return { valid: true, message: null };
    },
    [order, totals.remainingBalance],
  );

  const submitCheckout = useCallback(
    async ({ paymentMethod = "cash", amountReceived = 0 } = {}) => {
      if (submittingRef.current) return null;

      const validation = validateCheckout({ paymentMethod, amountReceived });
      if (!validation.valid) {
        setError(validation.message);
        onError?.(validation.message);
        return null;
      }

      if (ONLINE_METHODS.includes(paymentMethod)) {
        return redirectToPayment(paymentMethod);
      }

      try {
        submittingRef.current = true;
        setIsSubmitting(true);
        setError(null);

        setOptimisticOrder({
          ...order,
          payment_method: paymentMethod,
          payment_status: "fully_paid",
        });

        const response = await checkoutOrder(order._id, {
          payment_method: paymentMethod,
          amount_received:
            paymentMethod === "cash"
              ? Number(amountReceived)
              : totals.remainingBalance,
        });
        const data = response?.data?.data || response?.data || null;

        setCheckoutResult(data);
        onSuccess?.(data);

        return data;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Khong the checkout hoa don.";

        setOptimisticOrder(null);
        setError(message);
        onError?.(message);
        return null;
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      order,
      totals.remainingBalance,
      validateCheckout,
      redirectToPayment,
      onSuccess,
      onError,
    ],
  );

  return {
    checkoutOrderData: checkoutResult,
    optimisticOrder,
    ...totals,
    payment,
    isSubmitting,
    isProcessing: isSubmitting || payment.isCreatingPayment,
    error: error || payment.error,
    validateCheckout,
    submitCheckout,
  };
};
