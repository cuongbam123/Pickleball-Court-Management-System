// pages/admin/AdminBranchPage.jsx
import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Table from "../../components/ui/Table"; // Sử dụng component Table của bạn
import Button from "../../components/ui/Button"; // Sử dụng component Button của bạn
import { useBranches } from "../../features/facility/hooks/useBranches";
import BranchModal from "../../features/facility/components/BranchModal";
import clsx from "clsx";
import { LayoutGrid, Table2 } from "lucide-react";

const AdminBranchPage = () => {
  const { branches, isLoading, deleteBranch, createBranch, updateBranch } =
    useBranches();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  // Định nghĩa các cột cho Table component
  const columns = [
    { header: "Tên chi nhánh", accessor: "name" },
    { header: "Địa chỉ", accessor: "address" },
    { header: "Hotline", accessor: "hotline" },
    {
      header: "Giờ hoạt động",
      render: (item) => `${item.open_time} - ${item.close_time}`,
    },
    {
      header: "Thao tác",
      render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenEdit(item)}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sửa
          </button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteBranch(item._id)}
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  const renderBranchCard = (branch) => (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{branch.name}</h3>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
          Hoạt động
        </span>
      </div>

      <div className="mb-4 flex-1 space-y-2 text-sm text-gray-700 dark:text-slate-300">
        <p className="flex items-start gap-2">
          📍 <span>{branch.address}</span>
        </p>
        <p className="flex items-center gap-2">
          📞 <span className="font-medium text-gray-900 dark:text-slate-100">{branch.hotline}</span>
        </p>
        <p className="flex items-center gap-2">
          ⏰{" "}
          <span>
            {branch.open_time} - {branch.close_time}
          </span>
        </p>
      </div>

      <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
        <button
          onClick={() => handleOpenEdit(branch)}
          className="rounded-lg px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Chỉnh sửa
        </button>
        <button
          onClick={() => deleteBranch(branch._id)}
          className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-200 dark:hover:bg-red-500/30"
        >
          Xóa
        </button>
      </div>
    </div>
  );

  const handleOpenAdd = () => {
    setEditingBranch(null); // Reset data
    setIsModalOpen(true);
  };
  const handleOpenEdit = (branch) => {
    setEditingBranch(branch); // Truyền data cũ vào
    setIsModalOpen(true);
  };

  // Xử lý khi ấn submit form
  const handleSubmitForm = async (formData) => {
    if (editingBranch) {
      return await updateBranch(editingBranch._id, formData);
    } else {
      return await createBranch(formData);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Quản lý chi nhánh
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Danh sách các cơ sở trên hệ thống
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Component Nút chuyển đổi View Mode */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => setViewMode("table")}
                className={clsx(
                  "rounded-lg p-2 transition-colors",
                  viewMode === "table"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                )}
                title="Dạng bảng"
              >
                <Table2 size={20} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "rounded-lg p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                )}
                title="Dạng lưới"
              >
                <LayoutGrid size={20} />
              </button>
            </div>

            <button
              onClick={handleOpenAdd}
              className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              + Thêm chi nhánh
            </button>
          </div>
        </div>

        {/* Gọi Component Table đã nâng cấp */}
        <Table
          columns={columns}
          data={branches}
          loading={isLoading}
          rowKey="_id"
          viewMode={viewMode}
          renderGridItem={renderBranchCard}
          gridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          skeletonCount={viewMode === "grid" ? 6 : 5}
          emptyTitle="Chưa có chi nhánh nào"
          emptyDescription="Thêm chi nhánh đầu tiên để quản lý các cơ sở trên hệ thống."
          emptyAction={
            <Button onClick={handleOpenAdd}>+ Thêm chi nhánh</Button>
          }
        />
        <BranchModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingBranch}
          onSubmit={handleSubmitForm}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminBranchPage;
