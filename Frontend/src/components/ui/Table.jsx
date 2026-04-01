import clsx from "clsx";

export default function Table({
  columns = [],
  data = [],
  loading = false,
  rowKey = "_id",
  emptyText = "Không có dữ liệu",
  className,

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
      <div className="rounded-2xl border bg-white p-6 shadow-sm text-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  // 👉 empty state
  if (!data.length) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm text-center text-gray-500">
        {emptyText}
      </div>
    );
  }

  const allSelected =
    data.length > 0 &&
    data.every((item) => selectedRowKeys.includes(item[rowKey]));

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border bg-white shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* HEADER */}
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                  />
                </th>
              )}

              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  className="px-4 py-3 text-left font-semibold text-gray-700"
                >
                  {col.title}
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
                    "border-t transition-colors",
                    "hover:bg-gray-50",
                    isSelected && "bg-blue-50"
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
                      />
                    </td>
                  )}

                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key || colIndex}
                      className="px-4 py-3 text-gray-700"
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        : row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}