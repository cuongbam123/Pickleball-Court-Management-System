// pages/admin/AdminCourtPage.jsx
import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Table from "../../components/ui/Table";
import SelectFilter from "../../components/ui/Filter";
import CourtModal from "../../features/facility/components/CourtModal";
import { useCourts } from "../../features/facility/hooks/useCourts";
import clsx from "clsx";
import { LayoutGrid, Table2 } from "lucide-react";

const AdminCourtPage = () => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");
  const {
    courts,
    branches,
    isLoading,
    createCourt,
    updateCourt,
    deleteCourt,
    toggleStatus,
  } = useCourts({
    branch_id: selectedBranchFilter,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const isFiltered = Boolean(selectedBranchFilter);

  const handleOpenAdd = () => {
    setEditingCourt(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (court) => {
    setEditingCourt(court);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (branchId, formData) => {
    if (editingCourt) {
      return await updateCourt(editingCourt._id, formData);
    } else {
      return await createCourt(branchId, formData);
    }
  };

  const columns = [
    {
      title: "Tên sân",
      key: "name",
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
      ),
    },
    { title: "Chi nhánh", key: "branch_name" },
    {
      title: "Loại sân",
      key: "type",
      render: (item) => (item.type === "2-player" ? "2 Người" : "4 Người"),
    },
    {
      title: "Tình trạng",
      key: "tagStatus",
      render: (item) => (
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
            item.tagStatus === "available"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
              : "bg-amber-100 text-amber-700",
          )}
        >
          {item.tagStatus}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (item) => (
        <button
          onClick={() => toggleStatus(item._id, item.status)}
          className={clsx(
            "rounded-lg px-3 py-1 text-sm font-medium transition-colors",
            item.status === "active"
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200"
              : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200",
          )}
        >
          {item.status === "active" ? "Hoạt động" : "Bảo trì"}
        </button>
      ),
    },
    {
      title: "Thao tác",
      render: (item) => (
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenEdit(item)}
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            Sửa
          </button>
          <button
            onClick={() => deleteCourt(item._id)}
            className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];
  const renderCourtCard = (court) => (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">{court.name}</h3>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{court.branch_name}</p>
        </div>
        <span className={clsx(
          "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
          court.tagStatus === "available"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
        )}>
          {court.tagStatus}
        </span>
      </div>

      <div className="mb-4 flex-1 space-y-3 text-sm text-gray-700 dark:text-slate-300">
        <p className="flex items-center gap-2">
          <span className="text-lg">👥</span> 
          <span className="font-medium">{court.type === "2-player" ? "Sân 2 Người" : "Sân 4 Người"}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span> 
          <button
            onClick={() => toggleStatus(court._id, court.status)}
            className={clsx(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors",
              court.status === "active"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200"
            )}
          >
            {court.status === "active" ? "Đang hoạt động" : "Đang bảo trì"}
          </button>
        </div>
      </div>

      <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
        <button
          onClick={() => handleOpenEdit(court)}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Chỉnh sửa
        </button>
        <button
          onClick={() => deleteCourt(court._id)}
          className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/30"
        >
          Xóa
        </button>
      </div>
    </div>
  );

  // Chuyển branches thành format cho SelectFilter
  const branchOptions = branches.map((b) => ({ label: b.name, value: b._id }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Quản lý sân bãi
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Hiển thị tất cả {courts.length} sân trên hệ thống
            </p>
          </div>
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
            className="whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            + Thêm sân mới
          </button>
        </div>

        {/* BỘ LỌC CÁC THỨ */}
        <div className="flex items-end gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <SelectFilter
            label="Lọc theo chi nhánh"
            options={branches.map((b) => ({ label: b.name, value: b._id }))}
            value={selectedBranchFilter}
            onChange={setSelectedBranchFilter}
            placeholder="Tất cả chi nhánh"
            className="w-64"
          />
        </div>

        <Table
          columns={columns}
          data={courts}
          loading={isLoading}
          rowKey="_id"
          viewMode={viewMode}
          renderGridItem={renderCourtCard}
          gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          skeletonCount={viewMode === "grid" ? 8 : 5}
          emptyTitle={
            isFiltered ? "Không có sân phù hợp" : "Chưa có sân nào"
          }
          emptyDescription={
            isFiltered
              ? "Thử chọn chi nhánh khác hoặc bỏ bộ lọc để xem tất cả sân."
              : "Thêm sân Pickleball đầu tiên vào hệ thống."
          }
          emptyAction={
            !isFiltered ? (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700"
              >
                + Thêm sân mới
              </button>
            ) : undefined
          }
        />
        <CourtModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingCourt}
          branches={branches}
          onSubmit={handleSubmitForm}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminCourtPage;
