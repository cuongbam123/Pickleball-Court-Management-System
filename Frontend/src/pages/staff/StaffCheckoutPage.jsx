import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StaffLayout from "../../layouts/StaffLayout";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import { useOrderCheckout } from "../../features/order/hooks/useOrderCheckout";
import { 
  ArrowLeft, 
  AlertTriangle, 
  CreditCard, 
  ReceiptText, 
  Banknote,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingBag,
} from "lucide-react";
import Spiral from "../../components/ui/Spiral";

const PRODUCT_TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "drink", label: "Nước uống" },
  { value: "equipment_rental", label: "Thuê dụng cụ" },
  { value: "retail", label: "Bán lẻ" },
];

const PRODUCT_TYPE_LABELS = {
  drink: "Nước uống",
  equipment_rental: "Thuê dụng cụ",
  retail: "Bán lẻ",
};

// Tiện ích format tiền tệ
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));
};

const StaffCheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  // State quản lý phương thức thanh toán UI chọn
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState(""); // Lưu tiền khách đưa

  // Gọi Custom Hook đã viết
  const {
    order,
    posItems,
    courtFee,
    posFee,
    deposit,
    totalBill,
    remainingBalance,
    isLoading,
    isProcessing,
    isPosMutating,
    isOrderLocked,
    products,
    isLoadingProducts,
    productsError,
    productSearch,
    setProductSearch,
    productType,
    setProductType,
    error,
    refreshOrder,
    handleCheckout,
    handleAddPosProduct,
    handleUpdatePosQuantity,
  } = useOrderCheckout(bookingId);

  const isBusy = isProcessing || isPosMutating;

  const getPosLineQty = (productId) => {
    const line = posItems.find(
      (item) => String(item.product_id) === String(productId),
    );
    return line?.quantity || 0;
  };

  // Định nghĩa cột cho Table POS
  const posColumns = [
    { header: "Sản phẩm/Dịch vụ", accessor: "name" },
    {
      header: "Số lượng",
      accessor: "quantity",
      align: "center",
      render: (row) =>
        isOrderLocked ? (
          <span className="font-semibold">{row.quantity}</span>
        ) : (
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                handleUpdatePosQuantity(row.product_id, row.quantity - 1)
              }
              className="rounded p-1 text-slate-600 hover:bg-white disabled:opacity-40"
              aria-label="Giảm số lượng"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold">
              {row.quantity}
            </span>
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                handleUpdatePosQuantity(row.product_id, row.quantity + 1)
              }
              className="rounded p-1 text-slate-600 hover:bg-white disabled:opacity-40"
              aria-label="Tăng số lượng"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
    },
    { 
      header: "Đơn giá", 
      accessor: "price",
      render: (row) => formatCurrency(row.price)
    },
    { 
      header: "Thành tiền", 
      accessor: "total_amount",
      align: "right",
      render: (row) => formatCurrency(row.total_amount)
    },
    ...(!isOrderLocked
      ? [
          {
            header: "",
            align: "right",
            render: (row) => (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleUpdatePosQuantity(row.product_id, 0)}
                className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                title="Xóa khỏi hóa đơn"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  const submitCheckout = async () => {
    const checkoutResult = await handleCheckout(
      remainingBalance > 0 ? paymentMethod : "cash",
      paymentMethod === "cash" ? amountReceived : 0,
    );

    if (checkoutResult?.payment_status === "fully_paid") {
      navigate(`/admin/orders/${checkoutResult._id}`, {
        replace: true,
        state: { fromCheckout: true, bookingId },
      });
    }
  };

  // ================= RENDER STATES ================= //

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
          <Spiral size="lg" className="text-blue-600" />
          <p className="text-slate-500 font-medium">Đang tải thông tin hóa đơn...</p>
        </div>
      </StaffLayout>
    );
  }

  if (error) {
    return (
      <StaffLayout>
        <div className="mx-auto max-w-2xl py-12">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Lỗi tải dữ liệu</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
              </Button>
              <Button onClick={refreshOrder}>
                <RefreshCw className="w-4 h-4 mr-2" /> Thử lại
              </Button>
            </div>
          </div>
        </div>
      </StaffLayout>
    );
  }

  // ================= MAIN UI ================= //

  return (
    <StaffLayout>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thanh toán trả sân</h1>
            <p className="text-sm text-slate-500">
              Mã Booking: <span className="font-mono text-slate-700">{bookingId}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refreshOrder} disabled={isBusy}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isBusy ? "animate-spin" : ""}`} />
          Làm mới Bill
        </Button>
      </div>

      {/* GRID LAYOUT: Left (Details) - Right (Summary) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* === CỘT TRÁI: CHI TIẾT === */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Thông tin tiền sân */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <ReceiptText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Tiền thuê sân</h2>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
              <span className="text-slate-600">Phí thuê sân (Đã bao gồm phụ phí giờ vàng nếu có)</span>
              <span className="font-bold text-lg text-slate-900">{formatCurrency(courtFee)}</span>
            </div>
          </section>

          {/* Card: Thông tin POS Items */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-800">Dịch vụ bổ sung (POS)</h2>
              </div>
              <span className="font-bold text-emerald-600">{formatCurrency(posFee)}</span>
            </div>
            
            {!isOrderLocked && (
              <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-slate-800">Thêm sản phẩm / dịch vụ</h3>
                </div>

                <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Tìm theo tên sản phẩm..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {PRODUCT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {productsError && (
                  <p className="mb-2 text-sm text-red-600">{productsError}</p>
                )}

                {isLoadingProducts ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500">
                    <Spiral size="sm" className="text-emerald-600" />
                    <span className="text-xs">Đang tải sản phẩm...</span>
                  </div>
                ) : products.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Không có sản phẩm phù hợp trong chi nhánh này.
                  </p>
                ) : (
                  <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                    {products.map((product) => {
                      const inBillQty = getPosLineQty(product._id);
                      const outOfStock = Number(product.stock) <= 0;

                      return (
                        <div
                          key={product._id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-white bg-white p-3 shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-slate-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {PRODUCT_TYPE_LABELS[product.type] || product.type}
                              {" · "}Tồn: {product.stock}
                              {inBillQty > 0 && (
                                <span className="ml-1 font-medium text-emerald-600">
                                  · Đã chọn: {inBillQty}
                                </span>
                              )}
                            </p>
                            <p className="text-sm font-bold text-emerald-700">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isBusy || outOfStock}
                            onClick={() => handleAddPosProduct(product._id, 1)}
                            className="shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {isOrderLocked && (
              <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Hóa đơn đã thanh toán — không thể thêm hoặc sửa dịch vụ POS.
              </p>
            )}

            {posItems && posItems.length > 0 ? (
              <Table
                columns={posColumns}
                data={posItems}
                emptyText="Không có dịch vụ phát sinh"
              />
            ) : (
              <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg">
                Chưa có dịch vụ phát sinh. Dùng form phía trên để thêm nước uống, thuê vợt...
              </div>
            )}
          </section>
        </div>

        {/* === CỘT PHẢI: BILLING & PAYMENT === */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-slate-800 p-4 text-white">
              <h2 className="text-lg font-semibold">Tổng kết thanh toán</h2>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Breakdown tính tiền */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tiền sân</span>
                  <span>{formatCurrency(courtFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Dịch vụ (POS)</span>
                  <span>{formatCurrency(posFee)}</span>
                </div>
                <div className="my-2 border-t border-dashed border-slate-200" />
                <div className="flex justify-between font-medium text-slate-800 text-base">
                  <span>Tổng hóa đơn</span>
                  <span>{formatCurrency(totalBill)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Đã đặt cọc</span>
                  <span>- {formatCurrency(deposit)}</span>
                </div>
              </div>

              <div className="my-4 border-t border-slate-200" />

              {/* Số tiền cần thu */}
              <div className="flex items-end justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                <span className="text-sm font-semibold text-blue-800 mb-1">CẦN THU:</span>
                <span className="text-3xl font-black text-blue-600 leading-none">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>

              {/* Lựa chọn phương thức thanh toán (Chỉ hiện nếu cần thu tiền) */}
              {remainingBalance > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Phương thức thanh toán:</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition ${
                        paymentMethod === "cash" 
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Banknote className="h-6 w-6" />
                      <span className="text-sm font-medium">Tiền mặt</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("transfer")}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition ${
                        paymentMethod === "transfer"
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span className="text-sm font-medium">Chuyển khoản</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("vnpay")}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition ${
                        paymentMethod === "vnpay"
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span className="text-sm font-medium">VNPay</span>
                    </button>
                  </div>

                  {paymentMethod === "cash" && (
                    <div className="mt-5 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Số tiền khách đưa:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          placeholder="Nhập số tiền..."
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="absolute right-4 top-3.5 text-slate-500 font-medium">VNĐ</span>
                      </div>

                      {Number(amountReceived) > 0 && (
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm border border-slate-100">
                          <span className="text-slate-600 font-medium">Tiền trả lại khách:</span>
                          <span className={`font-bold text-lg ${
                            Number(amountReceived) < remainingBalance ? "text-red-500" : "text-emerald-600"
                          }`}>
                            {Number(amountReceived) < remainingBalance
                              ? "Khách đưa thiếu!"
                              : formatCurrency(Number(amountReceived) - remainingBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Nút Action */}
              <Button
                className="w-full mt-6 h-12 text-lg font-bold"
                size="lg"
                disabled={
                  isBusy ||
                  (paymentMethod === "cash" &&
                    remainingBalance > 0 &&
                    Number(amountReceived) < remainingBalance)
                }
                onClick={submitCheckout}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : remainingBalance === 0 ? (
                  "Hoàn tất (Không thu thêm)"
                ) : paymentMethod === "cash" ? (
                  "Đã nhận tiền & Hoàn tất"
                ) : paymentMethod === "transfer" ? (
                  "Xác nhận chuyển khoản"
                ) : (
                  "Tạo mã thanh toán VNPay"
                )}
              </Button>

            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffCheckoutPage;
