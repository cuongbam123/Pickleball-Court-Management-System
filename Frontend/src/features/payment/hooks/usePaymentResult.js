import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { checkPaymentStatus } from "../api/paymentApi";

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;
const SUCCESS_STATUSES = ["deposit_paid", "fully_paid"];

export const usePaymentResult = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("vnp_TxnRef");

  const signedReturnParams = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams],
  );

  const [status, setStatus] = useState("loading");
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setError("Không tìm thấy mã giao dịch VNPay.");
      return undefined;
    }

    let isCancelled = false;
    let timeoutId;

    const pollPaymentStatus = async (attempt = 1) => {
      try {
        setStatus("loading");
        setError(null);
        const response = await checkPaymentStatus(orderId, signedReturnParams);
        const data = response?.data?.data || response?.data || response || null;

        if (isCancelled) return;

        setOrderData(data);

        if (SUCCESS_STATUSES.includes(data?.payment_status)) {
          setStatus("success");
          return;
        }

        if (data?.payment_status === "failed") {
          setStatus("failed");
          setError(data?.failure_reason || "Giao dịch thanh toán thất bại.");
          return;
        }

        if (attempt >= MAX_POLL_ATTEMPTS) {
          setStatus("pending");
          return;
        }

        // IPN có thể cập nhật DB chậm hơn redirect vài giây, nên tiếp tục poll.
        timeoutId = window.setTimeout(
          () => pollPaymentStatus(attempt + 1),
          POLL_INTERVAL_MS,
        );
      } catch (err) {
        if (isCancelled) return;

        const httpStatus = err?.response?.status;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể kiểm tra trạng thái thanh toán.";

        if ([400, 401, 403, 404].includes(httpStatus)) {
          setStatus("failed");
          setError(message);
          return;
        }

        if (attempt >= MAX_POLL_ATTEMPTS) {
          setStatus("pending");
          setError(message);
          return;
        }

        setError(message);
        timeoutId = window.setTimeout(
          () => pollPaymentStatus(attempt + 1),
          POLL_INTERVAL_MS,
        );
      }
    };

    pollPaymentStatus();

    return () => {
      isCancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [orderId, signedReturnParams]);

  return {
    status,
    orderData,
    error,
  };
};
