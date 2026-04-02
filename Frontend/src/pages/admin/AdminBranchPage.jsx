// pages/admin/AdminBranchPage.jsx
import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Table from "../../components/ui/Table"; // Sử dụng component Table của bạn
import Button from "../../components/ui/Button"; // Sử dụng component Button của bạn
import { useBranches } from "../../features/facility/hooks/useBranches";
import BranchModal from "../../features/facility/components/BranchModal";
import clsx from "clsx";

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
          <button onClick={() => handleOpenEdit(item)} className="...">
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-gray-900">{branch.name}</h3>
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
          Hoạt động
        </span>
      </div>

      <div className="flex-1 space-y-2 text-sm text-gray-600 mb-4">
        <p className="flex items-start gap-2">
          📍 <span>{branch.address}</span>
        </p>
        <p className="flex items-center gap-2">
          📞 <span className="font-medium text-gray-900">{branch.hotline}</span>
        </p>
        <p className="flex items-center gap-2">
          ⏰{" "}
          <span>
            {branch.open_time} - {branch.close_time}
          </span>
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
        <button onClick={() => handleOpenEdit(branch)} className="...">
          Chỉnh sửa
        </button>
        <button
          onClick={() => deleteBranch(branch._id)}
          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý chi nhánh
            </h1>
            <p className="text-slate-500 text-sm">
              Danh sách các cơ sở trên hệ thống
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Component Nút chuyển đổi View Mode */}
            <div className="bg-white border rounded-lg p-1 flex items-center shadow-sm">
              <button
                onClick={() => setViewMode("table")}
                className={clsx(
                  "p-2 rounded-md transition-colors",
                  viewMode === "table"
                    ? "bg-slate-100 text-blue-600"
                    : "text-slate-400 hover:text-slate-600",
                )}
                title="Dạng bảng"
              >
                {/* Icon Table (Bạn có thể dùng lucide-react, ở đây tôi dùng svg thuần) */}
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="3" y1="15" x2="21" y2="15"></line>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "p-2 rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-slate-100 text-blue-600"
                    : "text-slate-400 hover:text-slate-600",
                )}
                title="Dạng lưới"
              >
                {/* Icon Grid */}
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
            </div>

            <button onClick={handleOpenAdd} className="...">
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
