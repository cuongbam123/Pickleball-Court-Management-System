import clsx from "clsx";

/**
 * SkeletonLoader – Hiệu ứng shimmer loading placeholder.
 *
 * Dùng để thay thế nội dung thực khi đang fetch dữ liệu từ API,
 * giúp tránh layout shift và cải thiện cảm giác tốc độ (perceived performance).
 *
 * Gồm 3 phần:
 *   1. <Skeleton>          – Block cơ bản, tái sử dụng được ở mọi nơi
 *   2. <CourtCardSkeleton> – Skeleton cho card sân Pickleball (module Booking)
 *   3. <TableRowSkeleton>  – Skeleton cho một hàng trong bảng dữ liệu
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Block skeleton cơ bản
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string}  className  – override class Tailwind tuỳ ý
 * @param {string}  width      – inline width (mặc định 100%)
 * @param {string}  height     – inline height (mặc định 1rem)
 * @param {string}  rounded    – border-radius class (mặc định "rounded-lg")
 */
export function Skeleton({ className, width, height, rounded = "rounded-lg" }) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-slate-700/60",
        rounded,
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Skeleton card sân Pickleball (dùng cho module Booking)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Skeleton mô phỏng layout của CourtCard:
 *   [Ảnh sân]
 *   [Tên sân ──────]
 *   [Địa chỉ ───]
 *   [Giá tiền]   [Nút đặt]
 */
export function CourtCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/50 shadow-lg">
      {/* Thumbnail ảnh sân */}
      <Skeleton className="w-full" height="180px" rounded="rounded-none" />

      <div className="p-4 space-y-3">
        {/* Tên sân */}
        <Skeleton height="20px" width="75%" />

        {/* Địa chỉ */}
        <Skeleton height="14px" width="55%" />

        {/* Tag trạng thái + rating */}
        <div className="flex gap-2">
          <Skeleton height="22px" width="70px" rounded="rounded-full" />
          <Skeleton height="22px" width="60px" rounded="rounded-full" />
        </div>

        {/* Divider */}
        <Skeleton height="1px" className="opacity-40" />

        {/* Giá + nút đặt sân */}
        <div className="flex items-center justify-between">
          <Skeleton height="18px" width="80px" />
          <Skeleton height="36px" width="90px" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Render lưới nhiều CourtCardSkeleton cùng lúc.
 * @param {number} count – số lượng card skeleton (mặc định 6)
 */
export function CourtCardSkeletonGrid({ count = 6, className }) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CourtCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DataCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <Skeleton height="20px" width="65%" />
        <Skeleton height="22px" width="72px" rounded="rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton height="14px" width="90%" />
        <Skeleton height="14px" width="70%" />
        <Skeleton height="14px" width="55%" />
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Skeleton height="32px" width="72px" rounded="rounded-lg" />
        <Skeleton height="32px" width="56px" rounded="rounded-lg" />
      </div>
    </div>
  );
}

export function DataCardSkeletonGrid({ count = 6, className }) {
  return (
    <div className={clsx("grid gap-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <DataCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
      <Skeleton height="14px" width="55%" />
      <Skeleton className="mt-3" height="28px" width="40%" />
    </div>
  );
}

export function StatCardSkeletonGrid({ count = 4, className }) {
  return (
    <div className={clsx("grid gap-4 md:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileInfoSkeleton() {
  return (
    <div className="space-y-4" aria-label="Đang tải..." role="status">
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-slate-50 p-4">
            <Skeleton height="12px" width="40%" />
            <Skeleton className="mt-2" height="18px" width="70%" />
          </div>
        ))}
      </div>
      <Skeleton height="40px" width="140px" rounded="rounded-2xl" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Skeleton một hàng bảng dữ liệu (dùng cho Admin tables)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number} cols  – số cột trong hàng (mặc định 5)
 */
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-slate-700/40">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton
            height="14px"
            // Xen kẽ độ dài để trông tự nhiên hơn
            width={i === 0 ? "40px" : i % 3 === 0 ? "60%" : "80%"}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * Render nhiều TableRowSkeleton cùng lúc, bọc trong <tbody>.
 * @param {number} rows – số hàng skeleton (mặc định 5)
 * @param {number} cols – số cột mỗi hàng (mặc định 5)
 */
export function TableBodySkeleton({ rows = 5, cols = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </tbody>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export – component tổng quát nhất
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SkeletonLoader – dùng khi chỉ cần một khối loading đơn giản.
 *
 * @param {"card" | "table" | "text"} variant
 * @param {number}                    count
 * @param {number}                    cols      – chỉ dùng khi variant="table"
 */
function SkeletonLoader({ variant = "text", count = 1, cols = 5 }) {
  if (variant === "card") {
    return <CourtCardSkeletonGrid count={count} />;
  }

  if (variant === "table") {
    return <TableBodySkeleton rows={count} cols={cols} />;
  }

  // variant === "text" – block text đơn giản
  return (
    <div className="space-y-2" aria-label="Đang tải..." role="status">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height="16px" width={i % 2 === 0 ? "100%" : "80%"} />
      ))}
    </div>
  );
}

export default SkeletonLoader;
