import clsx from "clsx";

export default function Table({
  columns = [],
  data = [],
  loading = false,
  rowKey = "_id",
  emptyText = "Không có dữ liệu",
  className,

  // 👉 THÊM PROPS CHO VIEW MODE
  viewMode = "table", // "table" | "grid"
  renderGridItem, // (row, index) => ReactNode
  gridClassName = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", // Layout mặc định cho grid

  // selectable
  selectable = false,
  selectedRowKeys = [],
  onSelectRow,
  onSelectAll,

  // row click
  onRowClick,
}) {
  // 👉 loading state
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm flex flex-col items-center justify-center space-y-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent"></div>
        <div className="text-slate-600 dark:text-slate-300">Đang tải dữ liệu...</div>
      </div>
    );
  }

  // 👉 empty state
  if (!data.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {emptyText}
      </div>
    );
  }

  // ==========================================
  // RENDER DẠNG GRID (DẠNG THẺ)
  // ==========================================
  if (viewMode === "grid") {
    return (
      <div className={clsx("grid", gridClassName, className)}>
        {data.map((row, rowIndex) => (
          <div key={row[rowKey] || rowIndex} className="h-full">
            {renderGridItem
              ? renderGridItem(row, rowIndex)
              : <div className="p-4 border text-red-500">Vui lòng truyền renderGridItem prop</div>}
          </div>
        ))}
      </div>
    );
  }

  // ==========================================
  // RENDER DẠNG TABLE (BẢNG TRUYỀN THỐNG)
  // ==========================================
  const allSelected =
    data.length > 0 &&
    data.every((item) => selectedRowKeys.includes(item[rowKey]));

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* HEADER */}
          <thead className="bg-slate-100/80 dark:bg-slate-800">
            <tr>
              {selectable && (
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}

              {columns.map((col, index) => (
                <th
                  key={col.key || col.accessor || index}
                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap dark:text-slate-300"
                >
                  {col.title || col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {data.map((row, rowIndex) => {
              const isSelected = selectedRowKeys.includes(row[rowKey]);

              return (
                <tr
                  key={row[rowKey] || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    "border-t border-slate-200 transition-colors duration-150 dark:border-slate-700",
                    onRowClick && "cursor-pointer",
                    "hover:bg-lime-50/40 dark:hover:bg-slate-800/70",
                    isSelected && "bg-lime-50 dark:bg-lime-500/10"
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectRow?.(row);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}

                  {columns.map((col, colIndex) => {
                    const dataKey = col.key || col.accessor;
                    return (
                      <td
                        key={dataKey || colIndex}
                        className="px-4 py-3.5 text-slate-700 dark:text-slate-200"
                      >
                        {col.render
                          ? col.render(row, rowIndex)
                          : row[dataKey] ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}