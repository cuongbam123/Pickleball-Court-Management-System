import { useMemo, useState } from "react";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SelectFilter from "../../components/ui/Filter";
import Table from "../../components/ui/Table";
import PricingRuleFormModal from "../../features/pricing-rules/components/PricingRuleFormModal";
import usePricingRules from "../../features/pricing-rules/hooks/usePricingRules";
import {
  COURT_TYPE_OPTIONS,
  DAY_TYPE_OPTIONS,
  TIME_TYPE_OPTIONS,
} from "../../features/pricing-rules/constants/pricingRuleOptions";
import {
  formatCurrencyVnd,
  getCourtTypeLabel,
  getDayTypeLabel,
  getTimeTypeLabel,
} from "../../features/pricing-rules/utils/pricingRuleFormat";

const AdminPricingRulesPage = () => {
  const {
    rules,
    branchOptions,
    draftFilters,
    setDraftFilters,
    isLoading,
    isSubmitting,
    applyFilters,
    createRule,
    editRule,
    removeRule,
    meta,
  } = usePricingRules();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const branchMap = useMemo(
    () =>
      branchOptions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [branchOptions],
  );

  const handleChangeFilter = (field, value) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = (payload) => createRule(payload);

  const handleUpdateSubmit = (payload) => editRule(editingRule._id, payload);

  const columns = [
    {
      header: "Chi nhánh",
      render: (item) => branchMap[item.branch_id?._id || item.branch_id] || "Không xác định",
    },
    {
      header: "Loại sân",
      render: (item) => getCourtTypeLabel(item.court_type),
    },
    {
      header: "Ngày áp dụng",
      render: (item) => getDayTypeLabel(item.day_type),
    },
    {
      header: "Khung giờ",
      render: (item) => getTimeTypeLabel(item.time_type),
    },
    {
      header: "Thời gian",
      render: (item) => `${item.start_time} - ${item.end_time}`,
    },
    {
      header: "Giá mỗi giờ",
      render: (item) => formatCurrencyVnd(item.price_per_hour),
    },
    {
      header: "Thao tác",
      headerClassName: "w-28 text-right",
      cellClassName: "w-28",
      render: (item) => (
        <div className="flex items-center justify-end gap-3">
          <div className="group/edit relative">
            <button
              type="button"
              onClick={() => {
                setEditingRule(item);
                setIsFormOpen(true);
              }}
              className="cursor-pointer text-emerald-600 opacity-80 transition-all hover:opacity-100"
              title="Sửa cấu hình"
            >
              <Pencil size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/edit:block">
              Sửa cấu hình
            </span>
          </div>
          <div className="group/delete relative">
            <button
              type="button"
              onClick={() => setRuleToDelete(item)}
              className="cursor-pointer text-rose-500 opacity-80 transition-all hover:opacity-100"
              title="Xóa cấu hình"
            >
              <Trash2 size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/delete:block">
              Xóa cấu hình
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Cấu hình giá
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý giá theo chi nhánh, loại sân, ngày áp dụng và khung giờ.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <SelectFilter
            label="Chi nhánh"
            options={branchOptions}
            value={draftFilters.branch_id}
            onChange={(value) => handleChangeFilter("branch_id", value)}
            placeholder="Tất cả chi nhánh"
            className="min-w-[210px] flex-1"
          />
          <SelectFilter
            label="Loại sân"
            options={COURT_TYPE_OPTIONS}
            value={draftFilters.court_type}
            onChange={(value) => handleChangeFilter("court_type", value)}
            placeholder="Tất cả loại sân"
            className="min-w-[210px] flex-1"
          />
          <SelectFilter
            label="Ngày áp dụng"
            options={DAY_TYPE_OPTIONS}
            value={draftFilters.day_type}
            onChange={(value) => handleChangeFilter("day_type", value)}
            placeholder="Tất cả ngày"
            className="min-w-[210px] flex-1"
          />
          <SelectFilter
            label="Khung giờ"
            options={TIME_TYPE_OPTIONS}
            value={draftFilters.time_type}
            onChange={(value) => handleChangeFilter("time_type", value)}
            placeholder="Tất cả khung giờ"
            className="min-w-[210px] flex-1"
          />
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="primary"
              className="h-11 rounded-xl bg-blue-600 px-4 hover:bg-blue-500"
              leftIcon={<Filter size={16} />}
              onClick={applyFilters}
            >
              Lọc
            </Button>
            <Button
              variant="primary"
              className="h-11 rounded-xl bg-emerald-500 px-4 hover:bg-emerald-600"
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setEditingRule(null);
                setIsFormOpen(true);
              }}
            >
              Thêm cấu hình mới
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={rules}
          loading={isLoading}
          rowKey="_id"
          emptyText="Chưa có cấu hình giá nào."
        />

        <p className="text-xs text-slate-500">
          Tổng bản ghi: {meta?.total_records || 0}
        </p>
      </div>

      <PricingRuleFormModal
        open={isFormOpen}
        mode={editingRule ? "edit" : "create"}
        initialData={editingRule}
        branchOptions={branchOptions}
        submitting={isSubmitting}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRule(null);
        }}
        onSubmit={editingRule ? handleUpdateSubmit : handleCreateSubmit}
      />

      <Modal
        open={Boolean(ruleToDelete)}
        title="Xác nhận xóa cấu hình"
        description="Bạn có chắc chắn muốn xóa cấu hình giá này không?"
        onClose={() => setRuleToDelete(null)}
        onConfirm={async () => {
          if (!ruleToDelete?._id) return;
          const result = await removeRule(ruleToDelete._id);
          if (result.success) {
            setRuleToDelete(null);
          }
        }}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        confirmLoading={isSubmitting}
      />
    </AdminLayout>
  );
};

export default AdminPricingRulesPage;
