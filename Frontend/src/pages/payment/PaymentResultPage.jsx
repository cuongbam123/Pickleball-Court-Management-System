import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ReceiptText,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { usePaymentResult } from "../../features/payment/hooks/usePaymentResult";
import { getBookingHistoryPathByRole } from "../../features/payment/utils/paymentReturnUrl";
import Spiral from "../../components/ui/Spiral";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getDisplayAmount = (orderData) =>
  orderData?.amount ||
  orderData?.deposit_paid ||
  orderData?.final_amount_due ||
  orderData?.total_court_fee ||
  0;

const getDisplayOrderCode = (orderData) =>
  orderData?.order_id || orderData?.booking_id || orderData?.txn_ref || "N/A";

const ResultShell = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:py-14">
    <section className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {children}
    </section>
  </div>
);

const ViewBookingsButton = ({ className, variant = "primary" }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const base =
    "mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  const styles =
    variant === "primary"
      ? `${base} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500`
      : `${base} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-400`;

  const handleClick = () => {
    const path = getBookingHistoryPathByRole(user?.role);
    navigate(path);
  };

  return (
    <button type="button" onClick={handleClick} className={className || styles}>
      <CalendarDays className="h-4 w-4" />
      Xem lịch đặt sân
    </button>
  );
};

const PaymentResultPage = () => {
  const { status, orderData, error } = usePaymentResult();
  const displayAmount = getDisplayAmount(orderData);
  const displayOrderCode = getDisplayOrderCode(orderData);
  const retryPaymentPath = orderData?.booking_id
    ? `/payment/${orderData.booking_id}`
    : getBookingHistoryPathByRole(useAuthStore.getState().user?.role);

  if (status === "loading") {
    return (
      <ResultShell>
        <div className="flex flex-col items-center text-center py-6">
          <Spiral size="lg" className="text-blue-600 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900">
            Đang xác thực giao dịch...
          </h1>
        </div>
      </ResultShell>
    );
  }

  if (status === "success") {
    return (
      <ResultShell>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Thanh toán thành công
          </h1>

          <div className="mt-6 grid w-full gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <ReceiptText className="mt-0.5 h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Mã đơn
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                  {displayOrderCode}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Số tiền
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatCurrency(displayAmount)}
                </p>
              </div>
            </div>
          </div>

          <ViewBookingsButton />
        </div>
      </ResultShell>
    );
  }

  if (status === "failed") {
    return (
      <ResultShell>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Thanh toán thất bại
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            {error || orderData?.failure_reason || "Giao dịch không hoàn tất."}
          </p>

          <Link
            to={retryPaymentPath}
            className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Thử thanh toán lại
          </Link>
        </div>
      </ResultShell>
    );
  }

  return (
    <ResultShell>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Clock3 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Giao dịch đang được xử lý
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          Giao dịch đang được xử lý, vui lòng kiểm tra lại sau ít phút.
        </p>

        <ViewBookingsButton variant="outline" />
      </div>
    </ResultShell>
  );
};

export default PaymentResultPage;
