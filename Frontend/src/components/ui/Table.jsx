import clsx from "clsx";
import EmptyState from "./EmptyState";
import {
  DataCardSkeletonGrid,
  TableBodySkeleton,
} from "./SkeletonLoader";

export default function Table({
  columns = [],
  data = [],
  loading = false,
  rowKey = "_id",
  emptyText = "Không có dữ liệu",
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyVariant = "light",
  className,
  viewMode = "table",
  renderGridItem,
  gridClassName = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",
  skeletonCount = 6,
  selectable = false,
  selectedRowKeys = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
}) {
  const resolvedEmptyTitle = emptyTitle ?? emptyText;

  if (loading) {
    if (viewMode === "grid") {
      return (
        <DataCardSkeletonGrid
          count={skeletonCount}
          className={gridClassName}
        />
      );
    }

    const colCount = Math.max(columns.length, 1);

    return (
      <div
        className={clsx(
          "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900",
          className,
        )}
        aria-busy="true"
        aria-label="Đang tải dữ liệu"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100/80 dark:bg-slate-800">
              <tr>
                {selectable && <th className="px-4 py-3" />}
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
            <TableBodySkeleton
              rows={skeletonCount}
              cols={selectable ? colCount + 1 : colCount}
            />
          </table>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        variant={emptyVariant}
        title={resolvedEmptyTitle}
        description={emptyDescription}
        actionButton={emptyAction}
        className={className}
      />
    );
  }

  if (viewMode === "grid") {
    return (
      <div className={clsx("grid", gridClassName, className)}>
        {data.map((row, rowIndex) => (
          <div key={row[rowKey] || rowIndex} className="h-full">
            {renderGridItem ? (
              renderGridItem(row, rowIndex)
            ) : (
              <div className="p-4 border text-red-500">
                Vui lòng truyền renderGridItem prop
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const allSelected =
    data.length > 0 &&
    data.every((item) => selectedRowKeys.includes(item[rowKey]));

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
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
                    isSelected && "bg-lime-50 dark:bg-lime-500/10",
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
                          : (row[dataKey] ?? "-")}
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
