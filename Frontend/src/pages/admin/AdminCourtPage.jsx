// pages/admin/AdminCourtPage.jsx
import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Table from "../../components/ui/Table";
import SelectFilter from "../../components/ui/Filter";
import CourtModal from "../../features/facility/components/CourtModal";
import { useCourts } from "../../features/facility/hooks/useCourts";
import clsx from "clsx";
import {
  Filter,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Table2,
  Trash2,
} from "lucide-react";

const AdminCourtPage = () => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");
  const [branchDraftFilter, setBranchDraftFilter] = useState("");
  const [searchName, setSearchName] = useState("");
  const [appliedSearchName, setAppliedSearchName] = useState("");
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

  const handleApplyFilters = () => {
    setSelectedBranchFilter(branchDraftFilter);
    setAppliedSearchName(searchName.trim().toLowerCase());
  };

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
              : item.tagStatus === "playing"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
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
        <div className="flex items-center justify-end gap-3">
          <div className="group/edit relative">
            <button
              type="button"
              onClick={() => handleOpenEdit(item)}
              className="cursor-pointer text-emerald-600 opacity-80 transition-all hover:opacity-100"
            >
              <Pencil size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/edit:block">
              Chỉnh sửa sân
            </span>
          </div>
          <div className="group/delete relative">
            <button
              type="button"
              onClick={() => deleteCourt(item._id)}
              className="cursor-pointer text-rose-500 opacity-80 transition-all hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/delete:block">
              Xóa sân
            </span>
          </div>
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

  const filteredCourts = courts.filter((court) =>
    appliedSearchName
      ? court.name?.toLowerCase().includes(appliedSearchName)
      : true,
  );

  return (
    <AdminLayout>
      <div className="space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản lý sân bãi
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Hiển thị tất cả {courts.length} sân trên hệ thống
            </p>
          </div>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setViewMode("table")}
              className={clsx(
                "cursor-pointer rounded-lg p-2 transition-colors",
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
                "cursor-pointer rounded-lg p-2 transition-colors",
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
            className="inline-flex cursor-pointer whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" />
            Thêm sân mới
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Tìm theo tên sân
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Tìm theo tên sân"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <SelectFilter
            label="Lọc theo chi nhánh"
            options={branches.map((b) => ({ label: b.name, value: b._id }))}
            value={branchDraftFilter}
            onChange={setBranchDraftFilter}
            placeholder="Tất cả chi nhánh"
            className="min-w-[220px] flex-1"
          />
          <button
            type="button"
            onClick={handleApplyFilters}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-500 hover:shadow-md hover:shadow-blue-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:scale-[0.98]"
          >
            <Filter size={16} />
            Lọc
          </button>
        </div>

        <Table 
          columns={columns} 
          data={filteredCourts} 
          loading={isLoading} 
          rowKey="_id"
          viewMode={viewMode}
          renderGridItem={renderCourtCard}
          gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
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
