import React from "react";
import StaffLayout from "../../layouts/StaffLayout";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import Spiral from "../../components/ui/Spiral";
import { usePosInventory } from "../../features/pos/hooks/usePosInventory";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  ArrowUpDown,
  Package,
  Layers,
  Store,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  FileText,
  BadgeAlert,
} from "lucide-react";

// Tiện ích định dạng tiền tệ VND
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));
};

const PRODUCT_TYPE_OPTIONS = [
  { value: "drink", label: "Nước uống" },
  { value: "equipment_rental", label: "Thuê dụng cụ" },
  { value: "retail", label: "Bán lẻ" },
];

const PRODUCT_TYPE_LABELS = {
  drink: "Nước uống",
  equipment_rental: "Thuê dụng cụ",
  retail: "Bán lẻ",
};

const StaffPosProductsPage = () => {
  // Sử dụng Custom Hook đã tách biệt hoàn toàn phần logic
  const {
    isAdmin,
    isManagerOrAdmin,
    branches,
    isLoadingBranches,
    selectedBranchId,
    setSelectedBranchId,
    activeBranch,
    products,
    isLoadingProducts,
    productCountMeta,
    page,
    setPage,
    search,
    setSearch,
    type,
    setType,
    refreshProducts,
    stats,

    // Product Modals & CRUD
    isProductModalOpen,
    setIsProductModalOpen,
    productModalMode,
    selectedProduct,
    openCreateModal,
    openEditModal,
    productFormData,
    setProductFormData,
    productFormErrors,
    isProductSubmitting,
    handleProductSubmit,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    openDeleteConfirm,
    handleDeleteProduct,

    // Stock In/Out Adjustment
    isAdjustStockModalOpen,
    setIsAdjustStockModalOpen,
    openAdjustStockModal,
    adjustFormData,
    setAdjustFormData,
    adjustFormErrors,
    isAdjustSubmitting,
    handleAdjustTypeChange,
    handleAdjustSubmit,
  } = usePosInventory();

  // Định nghĩa các cột cho Table sản phẩm
  const columns = [
    {
      header: "Tên sản phẩm",
      accessor: "name",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
          <span className="text-xs text-slate-400 font-mono">ID: {row._id}</span>
        </div>
      ),
    },
    {
      header: "Phân loại",
      accessor: "type",
      render: (row) => {
        const typeClasses = {
          drink: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
          equipment_rental: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
          retail: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
        };

        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              typeClasses[row.type] || "bg-slate-50 text-slate-600 border-slate-100"
            }`}
          >
            {PRODUCT_TYPE_LABELS[row.type] || row.type}
          </span>
        );
      },
    },
    {
      header: "Đơn giá",
      accessor: "price",
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(row.price)}</span>,
    },
    {
      header: "Tồn kho",
      accessor: "stock",
      render: (row) => {
        const stockCount = Number(row.stock || 0);

        if (stockCount === 0) {
          return (
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg border border-red-100 dark:border-red-500/20 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" /> Hết hàng
            </span>
          );
        }

        if (stockCount <= 5) {
          return (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-500/20 text-xs">
              Sắp hết ({stockCount})
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20 text-xs">
            Còn hàng ({stockCount})
          </span>
        );
      },
    },
    ...(isManagerOrAdmin
      ? [
          {
            header: "Hành động",
            align: "right",
            render: (row) => (
              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<ArrowUpDown className="h-3.5 w-3.5 text-blue-500" />}
                  onClick={() => openAdjustStockModal(row)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:hover:bg-blue-500/10"
                >
                  Nhập/Xuất kho
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Edit2 className="h-3.5 w-3.5 text-slate-500" />}
                  onClick={() => openEditModal(row)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Sửa
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
                  onClick={() => openDeleteConfirm(row)}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Xóa
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Kho sản phẩm & POS</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thực hiện thêm mới sản phẩm, cập nhật giá bán và điều chỉnh xuất/nhập kho trực tiếp tại chi nhánh.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Nếu là Admin/SuperAdmin thì cho phép chọn chi nhánh */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Store size={18} className="text-slate-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {isLoadingBranches ? (
                    <option>Đang tải chi nhánh...</option>
                  ) : (
                    branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2 rounded-2xl text-sm font-bold dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                <Store size={16} />
                <span>Chi nhánh: {activeBranch?.name || "Đang xác định..."}</span>
              </div>
            )}

            {isManagerOrAdmin && (
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
                Thêm sản phẩm
              </Button>
            )}
          </div>
        </div>

        {/* ================= STATISTICS SECTION ================= */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard title="Tổng sản phẩm" value={stats.total} color="blue" icon={Package} />
          <StatCard title="Nước uống" value={stats.drinks} color="emerald" icon={Layers} />
          <StatCard title="Thuê dụng cụ" value={stats.rentals} color="indigo" icon={ArrowUpDown} />
          <StatCard title="Bán lẻ" value={stats.retails} color="purple" icon={FileText} />
          <StatCard title="Cảnh báo hết" value={stats.outOfStock} color="red" icon={BadgeAlert} isCritical />
          <StatCard title="Sắp hết hàng" value={stats.lowStock} color="amber" icon={AlertTriangle} />
        </div>

        {/* ================= FILTER & SEARCH ================= */}
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm sản phẩm theo tên..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Tất cả phân loại</option>
              {PRODUCT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button variant="outline" size="md" onClick={refreshProducts} disabled={isLoadingProducts}>
              <RefreshCw size={16} className={isLoadingProducts ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* ================= TABLE LIST ================= */}
        {isLoadingProducts ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
            <Spiral size="lg" className="text-emerald-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang tải danh sách kho...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table
              columns={columns}
              data={products}
              rowKey="_id"
              emptyText="Không tìm thấy sản phẩm nào trong chi nhánh này."
              emptyDescription="Hãy bấm vào nút 'Thêm sản phẩm' ở góc trên để tạo mới."
            />

            {/* Pagination Controls */}
            {productCountMeta.total_pages > 1 && (
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Hiển thị {products.length} trên tổng số {productCountMeta.total_records} sản phẩm
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trước
                  </Button>
                  <span className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 px-2">
                    Trang {page} / {productCountMeta.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === productCountMeta.total_pages}
                    onClick={() => setPage((p) => Math.min(productCountMeta.total_pages, p + 1))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL: CREATE / EDIT PRODUCT ================= */}
        <Modal
          open={isProductModalOpen}
          title={productModalMode === "create" ? "Thêm sản phẩm mới" : "Cập nhật sản phẩm"}
          description={
            productModalMode === "create"
              ? "Điền thông tin bên dưới để thêm sản phẩm mới vào chi nhánh đang chọn."
              : "Thay đổi thông tin chi tiết sản phẩm. Lưu ý: Không thể thay đổi trực tiếp lượng hàng tồn tại đây."
          }
          onClose={() => setIsProductModalOpen(false)}
          onConfirm={handleProductSubmit}
          confirmLoading={isProductSubmitting}
          confirmText={productModalMode === "create" ? "Thêm mới" : "Cập nhật"}
          confirmVariant="primary"
        >
          <div className="space-y-4 text-left">
            {productFormErrors.general && (
              <div className="flex gap-2 bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                <AlertTriangle size={18} className="shrink-0 text-red-500" />
                <span>{productFormErrors.general}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="VD: Nước suối Aquafina 500ml"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phân loại <span className="text-red-500">*</span>
                </label>
                <select
                  value={productFormData.type}
                  onChange={(e) => setProductFormData({ ...productFormData, type: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {PRODUCT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giá bán (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  placeholder="VD: 15000"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Chỉ hiển thị trường tồn kho ban đầu khi tạo mới */}
            {productModalMode === "create" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số lượng tồn kho ban đầu
                </label>
                <input
                  type="number"
                  value={productFormData.stock}
                  onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                  placeholder="VD: 100"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            )}
          </div>
        </Modal>

        {/* ================= MODAL: STOCK ADJUSTMENT (IN/OUT) ================= */}
        <Modal
          open={isAdjustStockModalOpen}
          title="Điều chỉnh tồn kho sản phẩm"
          description={`Thay đổi số lượng hàng tồn trong kho của sản phẩm: ${selectedProduct?.name}`}
          onClose={() => setIsAdjustStockModalOpen(false)}
          onConfirm={handleAdjustSubmit}
          confirmLoading={isAdjustSubmitting}
          confirmText="Xác nhận lưu"
          confirmVariant={adjustFormData.type === "in" ? "primary" : "danger"}
        >
          <div className="space-y-4 text-left">
            {adjustFormErrors.general && (
              <div className="flex gap-2 bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                <AlertTriangle size={18} className="shrink-0 text-red-500" />
                <span>{adjustFormErrors.general}</span>
              </div>
            )}

            {/* Tabs chọn Nhập / Xuất */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleAdjustTypeChange("in")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition-all ${
                  adjustFormData.type === "in"
                    ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <TrendingUp size={16} />
                Nhập kho (+)
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTypeChange("out")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition-all ${
                  adjustFormData.type === "out"
                    ? "bg-white text-red-600 shadow-sm dark:bg-slate-900 dark:text-red-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <TrendingDown size={16} />
                Xuất / Hủy kho (-)
              </button>
            </div>

            {/* Chi tiết lượng tồn hiện có */}
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between dark:bg-slate-950 dark:border-slate-800">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Số lượng tồn hiện tại:</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{selectedProduct?.stock || 0}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số lượng giao dịch <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={adjustFormData.amount}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: e.target.value })}
                  placeholder="Nhập số lượng..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do điều chỉnh <span className="text-red-500">*</span>
                </label>
                <select
                  value={adjustFormData.reason}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {adjustFormData.type === "in" ? (
                    <>
                      <option value="restock">Nhập hàng mới bổ sung (Restock)</option>
                      <option value="adjustment">Khác - Điều chỉnh tăng số lượng</option>
                    </>
                  ) : (
                    <>
                      <option value="adjustment">Hủy hàng hư hỏng/hết hạn (Adjustment)</option>
                      <option value="refund">Khách trả lại hàng (Refund)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú thêm</label>
              <textarea
                rows={2}
                value={adjustFormData.note}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, note: e.target.value })}
                placeholder="Nhập ghi chú giải thích lý do nhập/xuất kho (nếu có)..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </Modal>

        {/* ================= MODAL: DELETE CONFIRMATION ================= */}
        <Modal
          open={isDeleteConfirmOpen}
          title="Xác nhận xóa sản phẩm"
          description={`Bạn có chắc chắn muốn xóa sản phẩm "${selectedProduct?.name}" khỏi kho hệ thống chi nhánh không?`}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteProduct}
          confirmText="Đồng ý xóa"
          confirmVariant="danger"
        >
          <div className="flex gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-left dark:bg-red-500/10 dark:border-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-400">
              <strong>Chú ý:</strong> Hành động xóa sẽ chuyển sản phẩm này thành trạng thái đã xóa. Lịch sử giao dịch tồn kho vẫn sẽ được lưu trữ để đối chiếu tài chính, tuy nhiên sản phẩm sẽ không xuất hiện trong danh mục POS hay chọn thanh toán nữa.
            </p>
          </div>
        </Modal>
      </div>
    </StaffLayout>
  );
};

// ================= COMPONENT CON: STAT CARD ================= //
const StatCard = ({ title, value, color, icon: Icon, isCritical = false }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400",
    purple: "bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400",
    red: "bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400",
    amber: "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate pr-1">
          {title}
        </p>
        {Icon && (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${colorClasses[color] || ""}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p
        className={`mt-2.5 text-2xl font-black ${
          isCritical && value > 0
            ? "text-red-600 dark:text-red-400 animate-pulse"
            : "text-slate-950 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

export default StaffPosProductsPage;
