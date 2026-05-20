import React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import StaffLayout from "../../layouts/StaffLayout";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import { useOrderDetail } from "../../features/order/hooks/useOrderDetail";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ReceiptText,
  CheckCircle2,
} from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));

const PAYMENT_STATUS_LABELS = {
  pending_deposit: "Chờ đặt cọc",
  deposit_paid: "Đã cọc",
  pending_final: "Chờ thanh toán nốt",
  fully_paid: "Đã thanh toán đủ",
};

const PAYMENT_METHOD_LABELS = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  vnpay: "VNPay",
  momo: "MoMo",
};

const StaffOrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromCheckout = Boolean(location.state?.fromCheckout);

  const {
    order,
    courtFee,
    posFee,
    deposit,
    totalBill,
    remainingBalance,
    posItems,
    isLoading,
    error,
  } = useOrderDetail(orderId);

  const booking = order?.booking_id;
  const customer = order?.user_id;

  const posColumns = [
    { header: "Sản phẩm / Dịch vụ", accessor: "name" },
    { header: "SL", accessor: "quantity", align: "center" },
    {
      header: "Đơn giá",
      accessor: "price",
      render: (row) => formatCurrency(row.price),
    },
    {
      header: "Thành tiền",
      accessor: "total_amount",
      align: "right",
      render: (row) => formatCurrency(row.total_amount),
    },
  ];

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="font-medium text-slate-500">Đang tải hóa đơn...</p>
        </div>
      </StaffLayout>
    );
  }

  if (error || !order) {
    return (
      <StaffLayout>
        <div className="mx-auto max-w-2xl py-12">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-lg font-bold text-slate-900">
              Không tải được hóa đơn
            </h2>
            <p className="mb-6 text-slate-600">{error || "Không tìm thấy dữ liệu."}</p>
            <Button variant="outline" onClick={() => navigate("/admin/booking-history")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại lịch sân
            </Button>
          </div>
        </div>
      </StaffLayout>
    );
  }

  const amountCollectedAtCounter = Math.max(totalBill - deposit, 0);

  return (
    <StaffLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {fromCheckout && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Thanh toán thành công. Dưới đây là chi tiết hóa đơn đã chốt.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Chi tiết hóa đơn</h1>
              <p className="text-sm text-slate-500">
                Mã HĐ:{" "}
                <span className="font-mono text-slate-700">
                  #{order._id?.slice(-8).toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          <Link to="/admin/booking-history">
            <Button variant="outline" size="sm">
              Lịch sân
            </Button>
          </Link>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Thông tin chung</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Khách hàng</dt>
              <dd className="font-medium text-slate-900">
                {customer?.full_name || "—"}
                {customer?.phone && (
                  <span className="ml-1 text-slate-500">({customer.phone})</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Mã booking</dt>
              <dd className="font-mono text-slate-800">
                {booking?._id
                  ? `#${String(booking._id).slice(-6).toUpperCase()}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ngày chơi</dt>
              <dd className="font-medium text-slate-900">
                {booking?.start_time
                  ? dayjs(booking.start_time).format("DD/MM/YYYY")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Khung giờ</dt>
              <dd className="font-medium text-slate-900">
                {booking?.start_time && booking?.end_time
                  ? `${dayjs(booking.start_time).format("HH:mm")} - ${dayjs(booking.end_time).format("HH:mm")}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Trạng thái thanh toán</dt>
              <dd>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Phương thức</dt>
              <dd className="font-medium text-slate-900">
                {PAYMENT_METHOD_LABELS[order.payment_method] ||
                  order.payment_method ||
                  "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Thời gian tạo</dt>
              <dd className="text-slate-800">
                {order.createdAt
                  ? dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Cập nhật lần cuối</dt>
              <dd className="text-slate-800">
                {order.updatedAt
                  ? dayjs(order.updatedAt).format("DD/MM/YYYY HH:mm")
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ReceiptText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Tiền thuê sân</h2>
          </div>
          <p className="text-right text-xl font-bold text-slate-900">
            {formatCurrency(courtFee)}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-800">Dịch vụ POS</h2>
            </div>
            <span className="font-bold text-emerald-600">{formatCurrency(posFee)}</span>
          </div>

          {posItems.length > 0 ? (
            <Table
              columns={posColumns}
              data={posItems}
              emptyText="Không có dịch vụ phát sinh"
            />
          ) : (
            <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-500">
              Không có dịch vụ bổ sung trên hóa đơn này.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-800 p-5 text-white shadow-lg">
          <h2 className="mb-4 text-lg font-semibold">Tổng kết</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between opacity-90">
              <span>Tổng hóa đơn (sân + POS)</span>
              <span>{formatCurrency(totalBill)}</span>
            </div>
            <div className="flex justify-between text-emerald-300">
              <span>Đã đặt cọc trước</span>
              <span>- {formatCurrency(deposit)}</span>
            </div>
            {order.payment_status === "fully_paid" ? (
              <div className="flex justify-between border-t border-slate-600 pt-3 text-base font-bold">
                <span>Đã thu tại quầy / lần cuối</span>
                <span>{formatCurrency(amountCollectedAtCounter)}</span>
              </div>
            ) : (
              <div className="flex justify-between border-t border-slate-600 pt-3 text-base font-bold text-amber-300">
                <span>Còn phải thu</span>
                <span>{formatCurrency(remainingBalance)}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </StaffLayout>
  );
};

export default StaffOrderDetailPage;