import { useCallback } from "react";
import { usePayment } from "./usePayment";

export const useOnlinePayment = (order, options = {}) => {
  const payment = usePayment(order, options);
  const { redirectToPayment } = payment;

  const payWithVnpay = useCallback(
    () => redirectToPayment("vnpay"),
    [redirectToPayment],
  );

  const payWithPaypal = useCallback(
    () => redirectToPayment("paypal"),
    [redirectToPayment],
  );

  return {
    ...payment,
    payWithVnpay,
    payWithPaypal,
  };
};
