import React, { useState } from "react";
import dayjs from "dayjs";
import { Download, Lock, CheckCircle, Eye, AlertCircle, Sparkles } from "lucide-react";
import Button from "../../../components/ui/Button";
import { toast } from "react-toastify";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const TransactionLogTable = ({
  open,
  onClose,
  paymentMethod,
  transactions = [],
  isLoading = false,
  onViewDetail,
}) => {
  const [isShiftClosed, setIsShiftClosed] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [closingNotes, setClosingNotes] = useState("");

  if (!open) return null;

  // Lọc giao dịch theo phương thức thanh toán
  // cash -> "cash", transfer -> "transfer", "vnpay", "momo"
  const filteredTxns = transactions.filter((t) => {
    if (paymentMethod === "cash") {
      return t.payment_method === "cash";
    } else if (paymentMethod === "transfer") {
      return ["transfer", "vnpay", "momo"].includes(t.payment_method);
    }
    return true;
  });

  // Gom nhóm giao dịch theo ngày
  const groupedTxns = filteredTxns.reduce((groups, txn) => {
    const date = dayjs(txn.updatedAt).format("YYYY-MM-DD");
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
    return groups;
  }, {});

  // Tính tổng số tiền thu được trong các giao dịch hiển thị
  const totalAmount = filteredTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Xuất file đối soát (CSV) hoạt động ngay tại Client
  const handleExport = () => {
    if (filteredTxns.length === 0) {
      toast.warning("Không có dữ liệu để xuất file!");
      return;
    }

    try {
      const headers = ["Thời gian", "Mã giao dịch", "Số tiền", "Phương thức", "Nội dung", "Khách hàng", "Thu ngân"];
      
      // Chuyển dữ liệu có dấu tiếng Việt sang không dấu hoặc dùng BOM để Excel đọc đúng UTF-8
      const csvRows = [
        "\uFEFF" + headers.join(","), // Thêm BOM UTF-8
        ...filteredTxns.map((t) => [
          dayjs(t.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
          t.webhook_transaction_id || t._id,
          t.amount,
          t.payment_method?.toUpperCase(),
          `"${t.summary?.replace(/"/g, '""') || ""}"`,
          `"${t.customer?.name || "Khách vãng lai"}"`,
          `"${t.cashier?.name || ""}"`
        ].join(","))
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `doi_soat_dong_tien_${paymentMethod}_${dayjs().format("YYYYMMDD")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Xuất file đối soát thành công!");
    } catch (error) {
      toast.error("Lỗi xuất file đối soát");
    }
  };

  // Kích hoạt chốt ca
  const handleConfirmCloseShift = () => {
    setIsShiftClosed(true);
    setShowConfirmClose(false);
    toast.success("Chốt ca & Khóa sổ thành công! Nhật ký giao dịch đã được niêm phong.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex flex-col w-full max-w-5xl h-[85vh] rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/20 dark:from-slate-950/20 dark:to-slate-900/10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isShiftClosed ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Nhật Ký Dòng Tiền - {paymentMethod === "cash" ? "Tiền Mặt 💵" : "Chuyển Khoản / Ví Điện Tử 💳"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Kiểm tra chi tiết luồng tiền phát sinh và thực hiện chốt sổ khóa ca thu ngân
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Action Bar & Stats Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 p-5 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">
                Tổng cộng dòng tiền
              </span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">
                Trạng thái sổ sách
              </span>
              {isShiftClosed ? (
                <span className="text-sm font-bold text-rose-500 flex items-center gap-1">
                  <Lock size={14} /> ĐÃ KHÓA SỔ
                </span>
              ) : (
                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1 animate-pulse">
                  ● ĐANG MỞ CA
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="secondary"
              className="flex items-center gap-2 rounded-xl text-xs py-2 shadow-sm font-bold"
            >
              <Download size={14} />
              Xuất file đối soát (CSV)
            </Button>
            
            <Button
              onClick={() => setShowConfirmClose(true)}
              disabled={isShiftClosed}
              variant={isShiftClosed ? "secondary" : "danger"}
              className={`flex items-center gap-2 rounded-xl text-xs py-2 shadow-sm font-bold ${!isShiftClosed && 'hover:scale-[1.02] active:scale-[0.98] transition-transform'}`}
            >
              <Lock size={14} />
              {isShiftClosed ? "Đã Khóa Sổ Ca" : "Chốt Ca & Khóa Sổ"}
            </Button>
          </div>
        </div>

        {/* Locked Banner Notification */}
        {isShiftClosed && (
          <div className="bg-rose-50 border-y border-rose-100 p-3.5 dark:bg-rose-950/20 dark:border-rose-900/30 flex items-center gap-3 animate-[slideDown_.25s_ease-out]">
            <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />
            <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
              Sổ quỹ ca làm việc này đã được chốt và ký số niêm phong. Tất cả các sửa đổi hoặc thanh toán phát sinh mới sẽ tự động chuyển sang ca tiếp theo.
            </p>
          </div>
        )}

        {/* Main Content (Table) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Đang tải nhật ký dòng tiền...</span>
            </div>
          ) : Object.keys(groupedTxns).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không có giao dịch nào</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Không tìm thấy giao dịch thành công nào bằng phương thức thanh toán này trong khoảng thời gian đã chọn.
              </p>
            </div>
          ) : (
            Object.keys(groupedTxns).sort((a, b) => b.localeCompare(a)).map((date) => {
              const txns = groupedTxns[date];
              const dateTotal = txns.reduce((sum, t) => sum + (t.amount || 0), 0);

              return (
                <div key={date} className="bg-white rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800/80 overflow-hidden">
                  
                  {/* Group Header */}
                  <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                      📅 Ngày {dayjs(date).format("DD/MM/YYYY")}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Số tiền phát sinh: <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(dateTotal)}</span> ({txns.length} giao dịch)
                    </span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/30 text-slate-500 font-semibold text-left border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Thời gian</th>
                          <th className="px-4 py-2.5">Mã giao dịch</th>
                          <th className="px-4 py-2.5">Số tiền</th>
                          <th className="px-4 py-2.5">Nội dung tóm tắt</th>
                          <th className="px-4 py-2.5">Khách hàng</th>
                          <th className="px-4 py-2.5 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {txns.map((txn) => (
                          <tr
                            key={txn._id}
                            className="hover:bg-slate-50/50 transition dark:hover:bg-slate-800/20"
                          >
                            <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-400">
                              {dayjs(txn.updatedAt).format("HH:mm:ss")}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                              {txn.webhook_transaction_id || txn._id?.substring(0, 10) + "..."}
                            </td>
                            <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white">
                              {formatCurrency(txn.amount)}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                              {txn.summary}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                              {txn.customer?.name || "Khách vãng lai"}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => onViewDetail(txn)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/50 px-2.5 py-1 font-bold text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition dark:border-blue-900/50 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                              >
                                <Eye size={12} />
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal for closing shift */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setShowConfirmClose(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-amber-500 animate-spin" size={18} />
              Xác nhận chốt ca & Khóa sổ sách?
            </h4>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn đang thực hiện khóa sổ quỹ phát sinh của ca thu ngân hiện tại. Tổng thực thu đối soát là <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</span>.
              Sau khi khóa, bạn sẽ không thể thêm hoặc chỉnh sửa dòng tiền của ca này.
            </p>
            
            <div className="mt-4">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú đối soát (nếu có)</label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Ví dụ: Đã kiểm đếm đủ tiền mặt trong két, không lệch quỹ..."
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowConfirmClose(false)} className="rounded-xl text-xs py-2">
                Hủy bỏ
              </Button>
              <Button variant="danger" onClick={handleConfirmCloseShift} className="rounded-xl text-xs py-2 shadow-md">
                Đồng ý chốt ca
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionLogTable;
