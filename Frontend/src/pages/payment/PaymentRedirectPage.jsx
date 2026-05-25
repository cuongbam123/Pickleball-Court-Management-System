import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { createDepositPaymentUrl } from "../../features/payment/api/paymentApi";
import { getPaymentResultReturnUrl } from "../../features/payment/utils/paymentReturnUrl";
import Spiral from "../../components/ui/Spiral";

const PaymentRedirectPage = () => {
  const { bookingId } = useParams();
  const hasStartedRef = useRef(false); // đảm bảo UI chỉ call 1 lần duy nhất
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const createPaymentLink = async () => {
      if (!bookingId) {
        setError("Không tìm thấy mã lịch đặt sân.");
        return;
      }

      try {
        const response = await createDepositPaymentUrl(bookingId, {
          payment_method: "vnpay",
          redirect_url: getPaymentResultReturnUrl(),
        });
        const paymentUrl = response?.data?.data?.payment_url;

        if (!paymentUrl) {
          throw new Error("Không tạo được link thanh toán VNPay.");
        }

        window.location.replace(paymentUrl);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tạo link thanh toán.",
        );
      }
    };

    createPaymentLink();
  }, [bookingId]);

  return (
    <MainLayout>
      <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-xl items-center justify-center px-4 py-10">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          {error ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-xl font-bold text-slate-900">
                Không thể tạo link thanh toán
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
              <Link
                to="/my-bookings"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Quay lại lịch đặt sân
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <Spiral size="lg" className="text-blue-600" />
              </div>
              <h1 className="mt-5 text-xl font-bold text-slate-900">
                Đang tạo link thanh toán...
              </h1>
            </>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default PaymentRedirectPage;
