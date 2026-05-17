import React, { useState } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import EmptyState from "../../components/ui/EmptyState";
import ErrorBoundary from "../../components/ui/ErrorBoundary";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import SkeletonLoader, {
  Skeleton,
  CourtCardSkeleton,
  CourtCardSkeletonGrid,
  DataCardSkeleton,
  DataCardSkeletonGrid,
  StatCardSkeleton,
  StatCardSkeletonGrid,
  ProfileInfoSkeleton,
  TableBodySkeleton,
} from "../../components/ui/SkeletonLoader";

const MOCK_TABLE_DATA = [
  {
    _id: "1",
    name: "Pickleball Center Q1",
    address: "123 Nguyễn Huệ, Q1",
    status: "Hoạt động",
  },
  {
    _id: "2",
    name: "Pickleball Center Q7",
    address: "456 Nguyễn Thị Thập, Q7",
    status: "Bảo trì",
  },
  {
    _id: "3",
    name: "Pickleball Thủ Đức",
    address: "789 Võ Văn Ngân",
    status: "Hoạt động",
  },
];

const TABLE_COLUMNS = [
  { header: "Tên", accessor: "name" },
  { header: "Địa chỉ", accessor: "address" },
  { header: "Trạng thái", accessor: "status" },
];

const SECTIONS = [
  { id: "skeleton", label: "SkeletonLoader" },
  { id: "empty", label: "EmptyState" },
  { id: "table", label: "Table" },
  { id: "error", label: "ErrorBoundary" },
  { id: "toast", label: "Toast (apiClient)" },
  { id: "profile", label: "Profile skeleton" },
];

function SectionCard({ id, title, description, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CrashDemo() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error("UITestPage: Lỗi React giả lập để test ErrorBoundary");
  }

  return (
    <Button variant="danger" onClick={() => setShouldCrash(true)}>
      Gây crash component con
    </Button>
  );
}

function UITestPage() {
  const [tableState, setTableState] = useState("data");
  const [tableViewMode, setTableViewMode] = useState("table");
  const [showReloadSkeleton, setShowReloadSkeleton] = useState(true);

  const tableLoading = tableState === "loading";
  const tableData = tableState === "data" ? MOCK_TABLE_DATA : [];

  const simulateSkeletonReload = () => {
    setShowReloadSkeleton(false);
    setTimeout(() => setShowReloadSkeleton(true), 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Dev only
            </p>
            <h1 className="text-lg font-bold text-slate-900">
              UI Components – Full Test
            </h1>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-emerald-600"
          >
            ← Về trang chủ
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        {/* Sidebar nav */}
        <nav className="hidden w-48 shrink-0 lg:block">
          <ul className="sticky top-20 space-y-1 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 space-y-8">
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Trang này dùng để kiểm tra nhanh{" "}
            <strong>EmptyState</strong>, <strong>SkeletonLoader</strong>,{" "}
            <strong>Table</strong>, <strong>ErrorBoundary</strong> và{" "}
            <strong>react-hot-toast</strong>. Route:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-emerald-700">
              /dev/ui-test
            </code>
          </p>

          {/* ── Skeleton ── */}
          <SectionCard
            id="skeleton"
            title="1. SkeletonLoader"
            description="Tất cả biến thể skeleton trong dự án."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={simulateSkeletonReload}>
                Giả lập reload (1.2s)
              </Button>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Skeleton block cơ bản
                </h3>
                <div className="max-w-md space-y-2 rounded-xl bg-slate-800 p-4">
                  <Skeleton height="12px" width="100%" />
                  <Skeleton height="12px" width="80%" />
                  <Skeleton height="12px" width="60%" />
                </div>
              </div>

              {showReloadSkeleton && (
                <>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      SkeletonLoader variant=&quot;text&quot;
                    </h3>
                    <SkeletonLoader variant="text" count={4} />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      StatCardSkeletonGrid (AdminHome)
                    </h3>
                    <StatCardSkeletonGrid count={4} />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      DataCardSkeletonGrid (Admin table grid)
                    </h3>
                    <DataCardSkeletonGrid
                      count={3}
                      className="grid-cols-1 md:grid-cols-3"
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      CourtCardSkeletonGrid (Booking – dark theme)
                    </h3>
                    <div className="rounded-xl bg-slate-900 p-4">
                      <CourtCardSkeletonGrid count={3} />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      TableBodySkeleton (Admin table)
                    </h3>
                    <div className="overflow-hidden rounded-xl border">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {TABLE_COLUMNS.map((c) => (
                              <th
                                key={c.accessor}
                                className="px-4 py-3 text-left font-semibold text-gray-700"
                              >
                                {c.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <TableBodySkeleton rows={4} cols={3} />
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">
                        DataCardSkeleton
                      </h3>
                      <DataCardSkeleton />
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">
                        StatCardSkeleton
                      </h3>
                      <StatCardSkeleton />
                    </div>
                    <div className="sm:col-span-2">
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">
                        CourtCardSkeleton
                      </h3>
                      <div className="max-w-xs rounded-xl bg-slate-900 p-2">
                        <CourtCardSkeleton />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!showReloadSkeleton && (
                <p className="text-sm text-slate-500 animate-pulse">
                  Đang reload skeleton...
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── EmptyState ── */}
          <SectionCard
            id="empty"
            title="2. EmptyState"
            description="variant light (admin) và dark (app tối)."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <EmptyState
                variant="light"
                title="Chưa có chi nhánh nào"
                description="Thêm chi nhánh đầu tiên để quản lý cơ sở."
                actionButton={
                  <Button size="sm">+ Thêm chi nhánh</Button>
                }
              />
              <div className="rounded-2xl bg-slate-900 p-2">
                <EmptyState
                  variant="dark"
                  title="Chưa có giải đấu"
                  description="Tạo giải đấu Pickleball đầu tiên."
                  actionButton={
                    <Button size="sm">Tạo giải đấu</Button>
                  }
                />
              </div>
              <EmptyState
                variant="light"
                title="Không tìm thấy kết quả"
                description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm."
              />
            </div>
          </SectionCard>

          {/* ── Table ── */}
          <SectionCard
            id="table"
            title="3. Table (loading / empty / data)"
            description="Giống pattern 4 trang admin."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {["loading", "empty", "data"].map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setTableState(state)}
                  className={clsx(
                    "rounded-xl px-4 py-2 text-sm font-medium transition",
                    tableState === state
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {state === "loading" && "Loading"}
                  {state === "empty" && "Empty"}
                  {state === "data" && "Có dữ liệu"}
                </button>
              ))}
              <span className="mx-2 w-px self-stretch bg-slate-200" />
              {["table", "grid"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTableViewMode(mode)}
                  className={clsx(
                    "rounded-xl px-4 py-2 text-sm font-medium transition",
                    tableViewMode === mode
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  View: {mode}
                </button>
              ))}
            </div>

            <Table
              columns={TABLE_COLUMNS}
              data={tableData}
              loading={tableLoading}
              viewMode={tableViewMode}
              rowKey="_id"
              skeletonCount={tableViewMode === "grid" ? 3 : 4}
              gridClassName="grid-cols-1 md:grid-cols-3 gap-4"
              emptyTitle={
                tableState === "empty"
                  ? "Chưa có dữ liệu test"
                  : "Không có dữ liệu"
              }
              emptyDescription="Đây là empty state từ component Table."
              emptyAction={
                <Button size="sm" onClick={() => setTableState("data")}>
                  Nạp dữ liệu mẫu
                </Button>
              }
              renderGridItem={(row) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="font-semibold text-slate-900">{row.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">{row.address}</p>
                  <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    {row.status}
                  </span>
                </div>
              )}
            />
          </SectionCard>

          {/* ── ErrorBoundary ── */}
          <SectionCard
            id="error"
            title="4. ErrorBoundary"
            description="Boundary cục bộ – không làm crash cả trang test."
          >
            <ErrorBoundary>
              <div className="rounded-xl border border-dashed border-red-200 bg-red-50/50 p-6">
                <p className="mb-4 text-sm text-slate-600">
                  Nhấn nút bên dưới để throw lỗi trong component con. ErrorBoundary
                  sẽ hiện UI fallback (giống App.jsx bọc ngoài).
                </p>
                <CrashDemo />
              </div>
            </ErrorBoundary>
          </SectionCard>

          {/* ── Toast ── */}
          <SectionCard
            id="toast"
            title="5. Toast (react-hot-toast / apiClient)"
            description="Các message giống interceptor trong apiClient.js."
          >
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => toast.success("Đăng nhập thành công!")}
              >
                Success
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => toast.error("Lỗi hệ thống, vui lòng thử lại sau.")}
              >
                Error 5xx
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast.error("Không thể kết nối máy chủ, kiểm tra kết nối mạng.")
                }
              >
                Network error
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.error("Không có quyền truy cập.")}
              >
                403 Forbidden
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Toaster global được cấu hình trong App.jsx (góc trên phải).
            </p>
          </SectionCard>

          {/* ── Profile ── */}
          <SectionCard
            id="profile"
            title="6. ProfileInfoSkeleton"
            description="Dùng trong ProfileForm khi đang fetch /api/v1/users/me."
          >
            <div className="max-w-2xl rounded-3xl border border-slate-200 p-6">
              <ProfileInfoSkeleton />
            </div>
          </SectionCard>

          {/* Checklist */}
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="font-bold text-emerald-900">Checklist test thủ công</h2>
            <ul className="mt-3 space-y-2 text-sm text-emerald-800">
              <li>□ Skeleton: shimmer chạy mượt, không nhảy layout</li>
              <li>□ EmptyState light/dark: đọc được text, nút CTA hoạt động</li>
              <li>□ Table: chuyển loading → empty → data, table ↔ grid</li>
              <li>□ ErrorBoundary: crash → fallback → Thử lại / Trang chủ</li>
              <li>□ Toast: hiện góc phải, màu đúng success/error</li>
              <li>□ App ErrorBoundary: crash ở route khác (không phải trang này)</li>
              <li>□ Admin pages thật: /admin/branches, /admin/courts, …</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}

export default UITestPage;
