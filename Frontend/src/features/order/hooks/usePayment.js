import { useCallback, useRef, useState } from "react";
import { payDeposit } from "../api/orderApi";
import { getPaymentResultReturnUrl } from "../../payment/utils/paymentReturnUrl";

const ONLINE_METHODS = ["vnpay", "paypal"];

export const usePayment = (order, options = {}) => {
  const { defaultMethod = "vnpay", redirectUrl = getPaymentResultReturnUrl() } =
    options;
  const creatingRef = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [error, setError] = useState(null);

  const createPaymentUrl = useCallback(
    async (method = paymentMethod) => {
      if (!order?._id || creatingRef.current) return null;

      if (!ONLINE_METHODS.includes(method)) {
        const message = "Phuong thuc thanh toan online khong hop le.";
        setError(message);
        return null;
      }

      try {
        creatingRef.current = true;
        setIsCreatingPayment(true);
        setError(null);

        const response = await payDeposit(order._id, {
          payment_method: method,
          redirect_url: redirectUrl,
        });
        const data = response?.data?.data || response?.data || {};
        const nextPaymentUrl = data.payment_url;

        if (!nextPaymentUrl) {
          throw new Error("Khong tao duoc link thanh toan.");
        }

        setPaymentMethod(method);
        setPaymentUrl(nextPaymentUrl);
        setExpiresAt(data.expires_at || null);

        return data;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Khong the tao link thanh toan.";
        setError(message);
        return null;
      } finally {
        creatingRef.current = false;
        setIsCreatingPayment(false);
      }
    },
    [order?._id, paymentMethod, redirectUrl],
  );

  const redirectToPayment = useCallback(
    async (method = paymentMethod) => {
      const data = await createPaymentUrl(method);
      if (data?.payment_url) {
        window.location.replace(data.payment_url);
      }
      return data;
    },
    [createPaymentUrl, paymentMethod],
  );

  const resetPayment = useCallback(() => {
    setPaymentUrl(null);
    setExpiresAt(null);
    setError(null);
  }, []);

  return {
    paymentMethod,
    setPaymentMethod,
    paymentUrl,
    expiresAt,
    isCreatingPayment,
    error,
    createPaymentUrl,
    redirectToPayment,
    resetPayment,
  };
};
