export function DataGrid({
  data = [],
  emptyText = "Không có dữ liệu",
  renderItem,
  gridClassName = "",
}) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gridClassName}`}
    >
      {data.map((item, index) => (
        <div key={item.id || index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}