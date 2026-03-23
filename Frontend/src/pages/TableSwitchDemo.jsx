import { useState } from "react";
import { Table, DataGrid, DataViewToggle } from "../components/ui";

const users = [
  {
    id: "1",
    fullName: "Anh Tuấn",
    email: "anhtuan@gmail.com",
    role: "admin",
    branch: "Quận 7",
  },
  {
    id: "2",
    fullName: "Thanh Sang",
    email: "thangsang@gmail.com",
    role: "staff",
    branch: "Thủ Đức",
  },
  {
    id: "3",
    fullName: "Minh Khoa",
    email: "minhkhoa@gmail.com",
    role: "customer",
    branch: "Bình Thạnh",
  },
];

const columns = [
  { key: "fullName", title: "Họ tên" },
  { key: "email", title: "Email" },
  { key: "role", title: "Vai trò" },
  { key: "branch", title: "Chi nhánh" },
];

export default function TableSwitchDemo() {
  const [viewMode, setViewMode] = useState("table");

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Danh sách người dùng
        </h1>

        <DataViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "table" ? (
        <Table columns={columns} data={users} rowKey="id" />
      ) : (
        <DataGrid
          data={users}
          renderItem={(user) => (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">
                {user.fullName}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-sm text-slate-600 box-shadow">Vai trò: {user.role}</p>
              <p className="mt-1 text-sm text-slate-600">
                Chi nhánh: {user.branch}
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
}