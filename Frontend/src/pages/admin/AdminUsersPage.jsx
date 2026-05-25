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
import { Search } from "lucide-react";
import dayjs from "dayjs";

const DetailItem = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
    <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
    <div className="font-semibold text-slate-800 dark:text-slate-100">{value !== undefined && value !== null && value !== "" ? value : "—"}</div>
  </div>
);

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
  const [selectedDetailUser, setSelectedDetailUser] = useState(null);
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

  const isFiltered = Boolean(selectedRole || searchName);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUserToUpdate(item._id);
            }}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
          >
            Chỉnh sửa
          </button>
          {currentUser?.role === "admin" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(item._id);
              }}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Xóa
            </button>
          )}
        </div>
      ),
    },
  ];

  const renderStaffCard = (user) => (
    <div
      onClick={() => setSelectedDetailUser(user)}
      className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-250 hover:shadow-md cursor-pointer hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user.full_name}</h3>
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Hoạt động
        </span>
      </div>

      <div className="mb-4 flex-1 space-y-2 text-sm text-gray-600 dark:text-slate-350">
        <p className="flex items-start gap-2">
          📧 <span>{user.email || "Chưa cập nhật"}</span>
        </p>
        <p className="flex items-center gap-2">
          📞{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {user.phone || "Chưa cập nhật"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          📍{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {branchNames[user.branch_id] || "Không xác định"}
          </span>
        </p>
      </div>

      <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setUserToUpdate(user._id);
          }}
          className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
        >
          Chỉnh sửa
        </button>
        {currentUser?.role === "admin" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(user._id);
            }}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý Người dùng
            </h1>
            <p className="text-sm text-slate-500">Danh sách các người dùng</p>
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
        <div className="flex flex-wrap items-end gap-5 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex-1 min-w-[280px]">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tìm theo tên
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Nhập tên người dùng..."
                className="w-full h-10 pl-10 pr-16 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              />
              <button
                type="button"
                onClick={handleSearchByName}
                className="absolute right-1.5 h-7 px-3 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Tìm
              </button>
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
            className="w-56"
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
            className="w-56"
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
            className="w-48"
          />
        </div>

        <Table
          columns={columns}
          data={users}
          loading={isLoading}
          rowKey="_id"
          viewMode={viewMode}
          renderGridItem={renderStaffCard}
          gridClassName="grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          skeletonCount={viewMode === "grid" ? 6 : 5}
          onRowClick={(row) => setSelectedDetailUser(row)}
          emptyTitle={
            isFiltered ? "Không tìm thấy người dùng" : "Chưa có người dùng"
          }
          emptyDescription={
            isFiltered
              ? "Không có tài khoản khớp bộ lọc hoặc từ khóa tìm kiếm. Thử đổi điều kiện."
              : "Danh sách người dùng đang trống."
          }
        />
      </div>

      <Modal
        open={Boolean(selectedDetailUser)}
        title="Chi tiết thông tin người dùng"
        onClose={() => setSelectedDetailUser(null)}
        hideFooter
      >
        {selectedDetailUser && (
          <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
            {/* Header Avatar and Name */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {selectedDetailUser.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {selectedDetailUser.full_name}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  ID: #{selectedDetailUser._id}
                </p>
              </div>
            </div>

            {/* Basic Info Section */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Thông tin cơ bản
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Email" value={selectedDetailUser.email} />
                <DetailItem label="Số điện thoại" value={selectedDetailUser.phone} />
                <DetailItem
                  label="Vai trò"
                  value={
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {selectedDetailUser.role}
                    </span>
                  }
                />
                <DetailItem
                  label="Chi nhánh"
                  value={branchNames[selectedDetailUser.branch_id] || "Không xác định"}
                />
              </div>
            </div>

            {/* Customer Specific Info */}
            {selectedDetailUser.role === "customer" && (
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Thông tin khách hàng
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Hạng thành viên"
                    value={
                      <span className={clsx(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                        selectedDetailUser.loyalty_tier === "diamond" && "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
                        selectedDetailUser.loyalty_tier === "gold" && "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                        selectedDetailUser.loyalty_tier === "silver" && "bg-slate-200 text-slate-700 dark:bg-slate-700/55 dark:text-slate-350",
                        selectedDetailUser.loyalty_tier === "standard" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {selectedDetailUser.loyalty_tier || "standard"}
                      </span>
                    }
                  />
                  <DetailItem
                    label="Điểm tích lũy"
                    value={selectedDetailUser.loyalty_points?.toLocaleString() || "0"}
                  />
                  <DetailItem
                    label="Rank kỹ năng"
                    value={selectedDetailUser.skill_rank || "Không xác định"}
                  />
                  <DetailItem
                    label="Điểm Elo"
                    value={selectedDetailUser.elo_score || "0"}
                  />
                  <DetailItem
                    label="Số dư ví"
                    value={`${(selectedDetailUser.credit || 0).toLocaleString("vi-VN")} đ`}
                  />
                </div>
              </div>
            )}

            {/* System Info Section */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Hệ thống
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Ngày tham gia"
                  value={
                    selectedDetailUser.createdAt
                      ? dayjs(selectedDetailUser.createdAt).format("DD/MM/YYYY HH:mm")
                      : "Không rõ"
                  }
                />
                <DetailItem
                  label="Cập nhật cuối"
                  value={
                    selectedDetailUser.updatedAt
                      ? dayjs(selectedDetailUser.updatedAt).format("DD/MM/YYYY HH:mm")
                      : "Không rõ"
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDetailUser(null)}
                className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

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
