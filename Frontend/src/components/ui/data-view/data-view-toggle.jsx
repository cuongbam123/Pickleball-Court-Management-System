import { Rows3, LayoutGrid } from "lucide-react";
import { cn } from "../../../lib/utils";

export function DataViewToggle({ viewMode = "table", onChange }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg transition",
          viewMode === "table"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        )}
        title="Dạng bảng"
      >
        <Rows3 size={18} />
      </button>

      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg transition",
          viewMode === "grid"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        )}
        title="Dạng ô vuông"
      >
        <LayoutGrid size={18} />
      </button>
    </div>
  );
}