import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkPaymentStatus } from "../../payment/api/paymentApi";

const DEFAULT_SUCCESS_STATUSES = ["deposit_paid", "fully_paid"];

const getPaymentData = (response) =>
  response?.data?.data || response?.data || response || null;

export const usePaymentPolling = ({
  txnRef,
  enabled = false,
  signedParams = {},
  intervalMs = 3000,
  maxAttempts = 20,
  successStatuses = DEFAULT_SUCCESS_STATUSES,
  onSuccess,
  onFailed,
  onTimeout,
} = {}) => {
  const timerRef = useRef(null);
  const stoppedRef = useRef(true);
  const attemptRef = useRef(0);
  const signedParamsKey = useMemo(
    () => JSON.stringify(signedParams || {}),
    [signedParams],
  );

  const [status, setStatus] = useState("idle");
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    stoppedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const poll = useCallback(async () => {
    if (!txnRef || stoppedRef.current) return;

    const nextAttempt = attemptRef.current + 1;
    attemptRef.current = nextAttempt;
    setAttempt(nextAttempt);
    setStatus("polling");

    try {
      const response = await checkPaymentStatus(
        txnRef,
        JSON.parse(signedParamsKey),
      );
      if (stoppedRef.current) return;

      const paymentData = getPaymentData(response);
      const paymentStatus = paymentData?.payment_status;

      setData(paymentData);
      setError(null);

      if (successStatuses.includes(paymentStatus)) {
        stoppedRef.current = true;
        clearTimer();
        setStatus("success");
        onSuccess?.(paymentData);
        return;
      }

      if (paymentStatus === "failed") {
        stoppedRef.current = true;
        clearTimer();
        setStatus("failed");
        setError(paymentData?.failure_reason || "Giao dich thanh toan that bai.");
        onFailed?.(paymentData);
        return;
      }

      if (nextAttempt >= maxAttempts) {
        stoppedRef.current = true;
        clearTimer();
        setStatus("timeout");
        onTimeout?.(paymentData);
        return;
      }

      timerRef.current = window.setTimeout(poll, intervalMs);
    } catch (err) {
      if (stoppedRef.current) return;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Khong the kiem tra trang thai thanh toan.";

      setError(message);

      if (nextAttempt >= maxAttempts) {
        stoppedRef.current = true;
        clearTimer();
        setStatus("timeout");
        onTimeout?.(null);
        return;
      }

      timerRef.current = window.setTimeout(poll, intervalMs);
    }
  }, [
    txnRef,
    signedParamsKey,
    successStatuses,
    maxAttempts,
    intervalMs,
    clearTimer,
    onSuccess,
    onFailed,
    onTimeout,
  ]);

  const startPolling = useCallback(() => {
    if (!txnRef) return;

    clearTimer();
    stoppedRef.current = false;
    attemptRef.current = 0;
    setAttempt(0);
    setStatus("polling");
    setError(null);
    poll();
  }, [txnRef, clearTimer, poll]);

  useEffect(() => {
    if (enabled) startPolling();
    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return {
    status,
    attempt,
    data,
    error,
    isPolling: status === "polling",
    startPolling,
    stopPolling,
  };
};
