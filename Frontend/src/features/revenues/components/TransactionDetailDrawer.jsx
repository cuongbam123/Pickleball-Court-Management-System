import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { X, Calendar, User, UserCheck, CreditCard, Building, Info, FileText, ArrowRight } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const TransactionDetailDrawer = ({ open, onClose, transaction }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open && !mounted) return null;

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "cash":
        return "Tiền mặt 💵";
      case "transfer":
        return "Chuyển khoản ngân hàng 💳";
      case "vnpay":
        return "Ví điện tử VNPay 💳";
      case "momo":
        return "Ví điện tử Momo 💳";
      default:
        return method?.toUpperCase();
    }
  };

  const getReferenceTypeLabel = (type) => {
    switch (type) {
      case "Booking":
        return "Đặt sân Pickleball 🎾";
      case "Order":
        return "Mua hàng POS / Căng tin 🛒";
      case "TournamentParticipant":
        return "Đăng ký giải đấu 🏆";
      default:
        return type;
    }
  };

  const {
    amount = 0,
    payment_method = "",
    reference_type = "",
    webhook_transaction_id,
    _id,
    createdAt,
    updatedAt,
    customer,
    branch,
    cashier,
    breakdown = { total_bill: 0, deposit_paid: 0, remaining_due: 0 },
    summary = "",
    payment_history = [],
  } = transaction || {};

  const txnId = webhook_transaction_id || _id;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer Body Container */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Main Wrapper */}
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Chi Tiết Chứng Từ Giao Dịch
                </h3>
                <p className="text-xxs font-mono text-slate-400 mt-0.5 truncate max-w-[280px]">
                  ID: {txnId}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 px-6 py-6 space-y-7">
              {/* Stat Highlight Block */}
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 p-6 text-center dark:border-slate-800/80 dark:from-slate-900/50 dark:to-slate-950">
                <span className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Số tiền thực thu (Đã thanh toán)
                </span>
                <h2 className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(amount)}
                </h2>
                <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xxs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    Thành công
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xxs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                    {payment_method?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Transaction Summary description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} /> Nội dung nghiệp vụ
                </h4>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {summary || "Không có mô tả chi tiết."}
                </p>
              </div>

              {/* CASHFLOW BREAKDOWN (Requirement 3: Breakdown flow) */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} /> Cấu thành dòng tiền (Cashflow Breakdown)
                </h4>

                <div className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                  {/* Step 1: Total bill */}
                  <div className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 border-2 border-white dark:bg-slate-700 dark:border-slate-900" />
                    <div>
                      <span className="text-xxs text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">
                        1. Tổng Hóa Đơn (Total Bill)
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        {formatCurrency(breakdown.total_bill)}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Deposit */}
                  <div className="relative">
                    <div className={`absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                      breakdown.deposit_paid > 0 ? "bg-amber-400 dark:bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                    }`} />
                    <div>
                      <span className="text-xxs text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">
                        2. Đã Đặt Cọc (Deposit Paid)
                      </span>
                      <span className={`text-sm font-extrabold ${breakdown.deposit_paid > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-200"}`}>
                        {formatCurrency(breakdown.deposit_paid)}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Final remaining paid */}
                  <div className="relative">
                    <div className={`absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                      reference_type === "Order" ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                    }`} />
                    <div>
                      <span className="text-xxs text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">
                        3. Thu Nốt / Thanh Toán Cuối (Remaining Due)
                      </span>
                      <span className={`text-sm font-extrabold ${reference_type === "Order" || breakdown.is_fully_paid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {formatCurrency(breakdown.remaining_due)}
                      </span>
                      {reference_type === "Booking" && breakdown.remaining_due > 0 && (
                        breakdown.is_fully_paid ? (
                          <p className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5">
                            ● Đã thu đủ tại quầy (Đã checkout)
                          </p>
                        ) : (
                          <p className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 mt-0.5 flex items-center gap-0.5">
                            ● Còn nợ (Chưa thu tại quầy checkout)
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Transactions / Payment History Timeline */}
              {payment_history && payment_history.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} /> Nhật ký thanh toán liên quan
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3.5">
                    {payment_history.map((hist, index) => (
                      <div key={hist._id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                            hist.type.includes("cọc") ? "bg-amber-400" : "bg-emerald-500"
                          }`}></span>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {hist.type} ({getPaymentMethodLabel(hist.payment_method)})
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {dayjs(hist.paid_at).format("DD/MM/YYYY HH:mm:ss")}
                            </p>
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          +{formatCurrency(hist.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Metadata Section */}
              <div className="border-t border-slate-100 pt-6 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Thông tin Đối tượng liên quan
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Customer */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-850 dark:bg-slate-900/20">
                    <span className="text-slate-400 dark:text-slate-500 text-xxs font-bold block mb-1 flex items-center gap-1">
                      <User size={12} /> Khách hàng
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                      {customer?.name || "Khách vãng lai"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {customer?.phone || "N/A"}
                    </span>
                  </div>

                  {/* Cashier */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-850 dark:bg-slate-900/20">
                    <span className="text-slate-400 dark:text-slate-500 text-xxs font-bold block mb-1 flex items-center gap-1">
                      <UserCheck size={12} /> Thu ngân trực ca
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                      {cashier?.name || "Hệ thống"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {cashier?.role || "System"}
                    </span>
                  </div>

                  {/* Branch */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-850 dark:bg-slate-900/20">
                    <span className="text-slate-400 dark:text-slate-500 text-xxs font-bold block mb-1 flex items-center gap-1">
                      <Building size={12} /> Chi nhánh
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                      {branch?.name || "Mặc định"}
                    </span>
                  </div>

                  {/* Booking / Ref details */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-850 dark:bg-slate-900/20">
                    <span className="text-slate-400 dark:text-slate-500 text-xxs font-bold block mb-1 flex items-center gap-1">
                      <CreditCard size={12} /> Nghiệp vụ gốc
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                      {getReferenceTypeLabel(reference_type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamp Details */}
              <div className="border-t border-slate-100 pt-5 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Khởi tạo lúc:</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-350">
                    {dayjs(createdAt).format("DD/MM/YYYY HH:mm:ss")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Thanh toán/Cập nhật lúc:</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-350">
                    {dayjs(updatedAt).format("DD/MM/YYYY HH:mm:ss")}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="border-t border-slate-100 px-6 py-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/35">
              <button
                onClick={() => window.print()}
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                🖨️ In hóa đơn chứng từ (Print)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailDrawer;
