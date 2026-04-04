// pages/admin/AdminCourtPage.jsx
import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Table from "../../components/ui/Table";
import SelectFilter from "../../components/ui/Filter";
import CourtModal from "../../features/facility/components/CourtModal";
import { useCourts } from "../../features/facility/hooks/useCourts";
import clsx from "clsx";

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
        <span className="font-bold text-slate-800">{item.name}</span>
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
            "px-2 py-1 rounded-full text-xs font-medium",
            item.tagStatus === "available"
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700",
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
            "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
            item.status === "active"
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200",
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
            className="text-blue-600 font-medium hover:underline text-sm"
          >
            Sửa
          </button>
          <button
            onClick={() => deleteCourt(item._id)}
            className="text-red-600 font-medium hover:underline text-sm"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];
  const renderCourtCard = (court) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{court.name}</h3>
          <p className="text-sm font-medium text-slate-500">{court.branch_name}</p>
        </div>
        <span className={clsx(
          "px-2 py-1 rounded-full text-xs font-medium",
          court.tagStatus === "available" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
        )}>
          {court.tagStatus}
        </span>
      </div>

      <div className="flex-1 space-y-3 text-sm text-gray-600 mb-4">
        <p className="flex items-center gap-2">
          <span className="text-lg">👥</span> 
          <span className="font-medium">{court.type === "2-player" ? "Sân 2 Người" : "Sân 4 Người"}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span> 
          <button
            onClick={() => toggleStatus(court._id, court.status)}
            className={clsx(
              "px-2 py-1 rounded-md text-xs font-medium transition-colors",
              court.status === "active" ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            {court.status === "active" ? "Đang hoạt động" : "Đang bảo trì"}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
        <button
          onClick={() => handleOpenEdit(court)}
          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
        >
          Chỉnh sửa
        </button>
        <button
          onClick={() => deleteCourt(court._id)}
          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
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
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý sân bãi
            </h1>
            <p className="text-slate-500 text-sm">
              Hiển thị tất cả {courts.length} sân trên hệ thống
            </p>
          </div>
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
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            + Thêm sân mới
          </button>
        </div>

        {/* BỘ LỌC CÁC THỨ */}
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-end gap-4">
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
