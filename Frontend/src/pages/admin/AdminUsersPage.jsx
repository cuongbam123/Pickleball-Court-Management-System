import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import useAdminUsers from "../../features/admin/hooks/useAdminUsers";
import useAdminStaff from "../../features/admin/hooks/useAdminStaff";
import AdminStaffForm from "../../features/auth/components/UpdateForm";
import Table from "../../components/ui/Table";
import clsx from "clsx";
import Modal from "../../components/ui/Modal";
import SelectFilter from "../../components/ui/Filter";
import { useAuthStore } from "../../store/authStore";
import { Filter, Pencil, Search, Trash2 } from "lucide-react";

const AdminUsersPage = () => {
  const { users, isLoading, fetchUsers } = useAdminUsers();
  const [viewMode, setViewMode] = useState("table");
  const {
    branches,
    branchNames,
    handleDeleteUser,
    handleUpdateUser,
    handleUpdateUserRank,
  } = useAdminStaff();
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [searchName, setSearchName] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const currentUser = useAuthStore((s) => s.user);

  const selectedUser = users.find((user) => user._id === userToUpdate) || null;

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
      fetchUsers({
        role: selectedRole || undefined,
        search: searchName || undefined,
        sortBy,
        sortOrder,
      });
    } else {
      alert("Cập nhật thất bại");
    }
    // Nếu là customer, cập nhật rank
    if (
      selectedUser.role === "customer" &&
      formData.rank &&
      formData.elo_score
    ) {
      const rankUpdateResult = await handleUpdateUserRank(userId, {
        skill_rank: formData.rank,
        elo_score: formData.elo_score,
      });
      if (rankUpdateResult.success) {
        fetchUsers({
          role: selectedRole || undefined,
          search: searchName || undefined,
          sortBy,
          sortOrder,
        });
      } else {
        alert("Cập nhật rank thất bại");
      }
    }
  };
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const result = await handleDeleteUser(userToDelete);
    console.log("Delete result:", result);

    if (result.success) {
      alert("Xóa thành công");
      closeDeleteModal();
      fetchUsers({
        role: selectedRole || undefined,
        search: searchName || undefined,
        sortBy,
        sortOrder,
      });
    } else {
      alert("Xóa thất bại");
    }
  };

  const handleRoleChange = (value) => {
    setSelectedRole(value);
    fetchUsers({
      role: value || undefined,
      search: searchName || undefined,
      sortBy,
      sortOrder,
    });
  };

  const handleSearchByName = () => {
    fetchUsers({
      role: selectedRole || undefined,
      search: searchName || undefined,
      sortBy,
      sortOrder,
    });
  };

  const handleApplyFilters = () => {
    handleSearchByName();
  };

  const columns = [
    { header: "Tên", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    { header: "Số điện thoại", accessor: "phone" },
    {
      header: "Chi nhánh",
      render: (item) => branchNames[item.branch_id] || "Không xác định",
    },
    {
      header: "Rank",
      render: (user) => user.skill_rank || "Không xác định",
    },
    {
      header: "Hạng thẻ thành viên",
      render: (user) => user.loyalty_tier || "Không xác định",
    },
    {
      header: "Vai trò",
      render: (user) => user.role,
    },
    {
      header: "Thao tác",
      render: (item) => (
        <div className="flex items-center justify-end gap-3">
          <div className="group/edit relative">
            <button
              type="button"
              onClick={() => setUserToUpdate(item._id)}
              className="cursor-pointer text-emerald-600 opacity-80 transition-all hover:opacity-100"
              title="Chỉnh sửa"
            >
              <Pencil size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/edit:block">
              Chỉnh sửa người dùng
            </span>
          </div>
          <div className="group/delete relative">
            <button
              type="button"
              onClick={() => openDeleteModal(item._id)}
              className="cursor-pointer text-rose-500 opacity-80 transition-all hover:opacity-100"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
            <span className="pointer-events-none absolute -top-10 right-0 z-10 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs text-white shadow-lg group-hover/delete:block">
              Xóa người dùng
            </span>
          </div>
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
            {branchNames[user.branch_id] || "Không xác định"}
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
      <div className="space-y-7">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Quản lý Người dùng
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách các người dùng và vai trò
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={clsx(
                  "cursor-pointer rounded-lg p-2 transition-colors",
                  viewMode === "table"
                    ? "bg-blue-50 text-blue-600"
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
                  "cursor-pointer rounded-lg p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-50 text-blue-600"
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
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tìm theo tên
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Tìm theo tên"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <SelectFilter
            label="Lọc theo vai trò"
            options={[
              { label: "Admin", value: "admin" },
              { label: "Manager", value: "manager" },
              { label: "Staff", value: "staff" },
              { label: "Customer", value: "customer" },
            ]}
            value={selectedRole}
            onChange={handleRoleChange}
            placeholder="Tất cả vai trò"
            className="min-w-[200px] flex-1"
          />
          <SelectFilter
            label="Sắp xếp theo"
            options={[
              { label: "Mới nhất", value: "createdAt" },
              { label: "Vai trò", value: "role" },
              { label: "Rank kỹ năng", value: "skill_rank" },
              { label: "Hạng thẻ thành viên", value: "loyalty_tier" },
            ]}
            value={sortBy}
            onChange={(value) => {
              setSortBy(value);
              fetchUsers({
                role: selectedRole || undefined,
                search: searchName || undefined,
                sortBy: value,
                sortOrder,
              });
            }}
            className="min-w-[180px] flex-1"
          />
          <SelectFilter
            label="Thứ tự"
            options={[
              { label: "Giảm dần", value: "desc" },
              { label: "Tăng dần", value: "asc" },
            ]}
            value={sortOrder}
            onChange={(value) => {
              setSortOrder(value);
              fetchUsers({
                role: selectedRole || undefined,
                search: searchName || undefined,
                sortBy,
                sortOrder: value,
              });
            }}
            className="min-w-[160px] flex-1"
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
          data={users}
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
          branches={branches}
          currentActorRole={currentUser?.role || "admin"}
          onCancel={() => setUserToUpdate(null)}
          onSubmit={handleSubmitUpdate}
        />
      </Modal>

      <Modal
        open={showDeleteModal}
        title="Xác nhận xóa"
        description="Bạn có chắc muốn xóa người dùng này không?"
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
      />
    </AdminLayout>
  );
};

export default AdminUsersPage;
