import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Table from "../../components/ui/Table";
import useAdminStaff from "../../features/admin/hooks/useAdminStaff";
import SelectFilter from "../../components/ui/Filter";
import AdminStaffForm from "../../features/auth/components/UpdateForm";
import Modal from "../../components/ui/Modal";
import clsx from "clsx";

const getBranchId = (branch) => {
  if (!branch) return null;
  if (typeof branch === "object") return branch._id || branch.id || null;
  return branch;
};

const AdminStaffPage = () => {
  const { users, branchNames, isLoading, handleDeleteUser, handleUpdateUser } =
    useAdminStaff();

  const [viewMode, setViewMode] = useState("table");
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");

  const selectedUser = users.find((user) => user._id === userToUpdate) || null;

  const getBranchName = (user) => {
    if (
      user?.branch_id &&
      typeof user.branch_id === "object" &&
      user.branch_id.name
    ) {
      return user.branch_id.name;
    }

    const branchId = getBranchId(user?.branch_id);
    return branchNames[branchId] || "Không xác định";
  };

  const openDeleteModal = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };
  const handleSubmitUpdate = async (userId, formData) => {
    const result = await handleUpdateUser(userId, formData);
    console.log("Update result:", result);

    if (result.success) {
      alert("Cập nhật thành công");
      setUserToUpdate(null);
    } else {
      alert("Cập nhật thất bại");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const result = await handleDeleteUser(userToDelete);

    if (result.success) {
      alert("Xóa thành công");
      closeDeleteModal();
    } else {
      alert("Xóa thất bại");
    }
  };
  const handleBranchChange = (value) => {
    setSelectedBranch(value);
  };
  const filteredUsers = users.filter((user) => {
    if (selectedBranch) {
      const userBranchId = getBranchId(user.branch_id);
      if (userBranchId !== selectedBranch) {
        return false;
      }
    }
    return true;
  });

  const columns = [
    { header: "Tên", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    { header: "Số điện thoại", accessor: "phone" },
    {
      header: "Chi nhánh",
      render: (item) => branchNames[item.branch_id] || "Không xác định",
    },
    {
      header: "Vai trò",
      render: (item) => (item.role === "admin" ? "Admin" : "Staff"),
    },
    {
      header: "Thao tác",
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUserToUpdate(item._id)}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
          >
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(item._id)}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  const renderStaffCard = (user) => (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-bold text-gray-900">{user.full_name}</h3>
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          Hoạt động
        </span>
      </div>

      <div className="mb-4 flex-1 space-y-2 text-sm text-gray-600">
        <p className="flex items-start gap-2">
          📧 <span>{user.email || "Chưa cập nhật"}</span>
        </p>
        <p className="flex items-center gap-2">
          📞{" "}
          <span className="font-medium text-gray-900">
            {user.phone || "Chưa cập nhật"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          📍{" "}
          <span className="font-medium text-gray-900">
            {getBranchName(user)}
          </span>
        </p>
      </div>

      <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setUserToUpdate(user._id)}
          className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
        >
          Chỉnh sửa
        </button>
        <button
          type="button"
          onClick={() => openDeleteModal(user._id)}
          className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          Xóa
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Staff</h1>
            <p className="text-sm text-slate-500">Danh sách các nhân viên</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={clsx(
                  "rounded-md p-2 transition-colors",
                  viewMode === "table"
                    ? "bg-slate-100 text-blue-600"
                    : "text-slate-400 hover:text-slate-600",
                )}
                title="Dạng bảng"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "rounded-md p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-slate-100 text-blue-600"
                    : "text-slate-400 hover:text-slate-600",
                )}
                title="Dạng lưới"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-end gap-4">
        <SelectFilter
          label="Lọc theo chi nhánh"
          options={Object.entries(branchNames).map(([id, name]) => ({
            value: id,
            label: name,
          }))}
          value={selectedBranch}
          onChange={handleBranchChange}
          className="w-64 px-3 py-2 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm hover:shadow-md transition-shadow"
          placeholder="Tất cả chi nhánh"
        />
        </div>

        <Table
          columns={columns}
          data={filteredUsers}
          loading={isLoading}
          rowKey="_id"
          viewMode={viewMode}
          renderGridItem={renderStaffCard}
          gridClassName="grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        />
      </div>

      <Modal
        open={Boolean(userToUpdate)}
        title="Cập nhật Staff"
        onClose={() => setUserToUpdate(null)}
        hideFooter
      >
        <AdminStaffForm
          user={selectedUser}
          onCancel={() => setUserToUpdate(null)}
          onSubmit={handleSubmitUpdate}
        />
      </Modal>

      <Modal
        open={showDeleteModal}
        title="Xác nhận xóa"
        description="Bạn có chắc muốn xóa staff này không?"
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
      />
    </AdminLayout>
  );
};

export default AdminStaffPage;
