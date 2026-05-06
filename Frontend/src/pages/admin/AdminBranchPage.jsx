// pages/admin/AdminBranchPage.jsx
import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Table from "../../components/ui/Table"; // Sử dụng component Table của bạn
import { useBranches } from "../../features/facility/hooks/useBranches";
import BranchModal from "../../features/facility/components/BranchModal";
import clsx from "clsx";
import { Filter, LayoutGrid, Pencil, Plus, Search, Table2, Trash2 } from "lucide-react";

const AdminBranchPage = () => {
  const { branches, isLoading, deleteBranch, createBranch, updateBranch } =
    useBranches();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const handleApplyFilters = () => {
    setAppliedSearch(searchDraft.trim().toLowerCase());
  };
  // Định nghĩa các cột cho Table component
  const columns = [
    {
      header: "Tên chi nhánh",
      accessor: "name",
      headerClassName: "w-[20%]",
      cellClassName: "whitespace-normal break-words",
    },
    {
      header: "Địa chỉ",
      accessor: "address",
      headerClassName: "w-[36%]",
      cellClassName: "whitespace-normal break-words",
    },
    {
      header: "Hotline",
      accessor: "hotline",
      headerClassName: "w-[16%]",
      cellClassName: "whitespace-nowrap",
    },
    {
      header: "Giờ hoạt động",
      headerClassName: "w-[16%] whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (item) => `${item.open_time} - ${item.close_time}`,
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
              onClick={() => handleOpenEdit(item)}
              className="cursor-pointer text-emerald-600 opacity-80 transition-all hover:opacity-100"
            >
              <Pencil size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/edit:block">
              Chỉnh sửa chi nhánh
            </span>
          </div>
          <div className="group/delete relative">
            <button
              type="button"
              onClick={() => deleteBranch(item._id)}
              className="cursor-pointer text-rose-500 opacity-80 transition-all hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/delete:block">
              Xóa chi nhánh
            </span>
          </div>
        </div>
      ),
    },
  ];

  const filteredBranches = branches.filter((branch) =>
    appliedSearch
      ? `${branch.name} ${branch.address} ${branch.hotline}`
          .toLowerCase()
          .includes(appliedSearch)
      : true,
  );

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
      <div className="space-y-7">
        {/* Header & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản lý chi nhánh
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Danh sách các cơ sở trên hệ thống
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Component Nút chuyển đổi View Mode */}
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
              className="inline-flex cursor-pointer items-center rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              <Plus size={16} className="mr-1" />
              Thêm chi nhánh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="min-w-[260px] flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Tìm theo tên/địa chỉ
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Tìm theo tên/địa chỉ/hotline"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
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
          data={filteredBranches}
          loading={isLoading}
          rowKey="_id"
          // Props điều khiển View
          viewMode={viewMode}
          renderGridItem={renderBranchCard}
          gridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
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
