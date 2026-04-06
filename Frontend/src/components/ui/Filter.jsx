// components/ui/SelectFilter.jsx
import React from "react";
import clsx from "clsx";

export default function SelectFilter({
  label,
  options = [], // Format: [{ label: "Chi nhánh A", value: "id_1" }, ...]
  value,
  onChange,
  placeholder = "Tất cả",
  className,
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
