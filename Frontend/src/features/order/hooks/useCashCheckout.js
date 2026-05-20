import { useCallback } from "react";
import { useCheckout } from "./useCheckout";

export const useCashCheckout = (order, options = {}) => {
  const checkout = useCheckout(order, options);
  const { submitCheckout } = checkout;

  const submitCashCheckout = useCallback(
    (amountReceived) =>
      submitCheckout({
        paymentMethod: "cash",
        amountReceived,
      }),
    [submitCheckout],
  );

  return {
    ...checkout,
    submitCashCheckout,
  };
};
