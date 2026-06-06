import React from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  page = 1,
  limit = 20,
  totalRecords = 0,
  totalPages = 1,
  startRecord = 0,
  endRecord = 0,
  isLoading = false,
  itemLabel = "bản ghi",
  limitOptions = [10, 20, 50, 100],
  onPageChange,
  onLimitChange,
}) => {
  if (!totalRecords) return null;

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => {
      if (totalPages <= 5) return true;
      if (pageNumber === 1 || pageNumber === totalPages) return true;
      return Math.abs(pageNumber - page) <= 1;
    });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Hiển thị{" "}
        <span className="font-bold text-slate-800 dark:text-slate-100">
          {startRecord}-{endRecord}
        </span>{" "}
        / {totalRecords} {itemLabel}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <span>Số dòng</span>
          <select
            value={limit}
            disabled={isLoading}
            onChange={(event) => onLimitChange?.(event.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => onPageChange?.(page - 1)}
            disabled={isLoading || page <= 1}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
            <span className="sm:hidden">Trước</span>
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            {visiblePages.map((pageNumber, index) => {
              const previousPage = visiblePages[index - 1];
              const showGap = previousPage && pageNumber - previousPage > 1;

              return (
                <React.Fragment key={pageNumber}>
                  {showGap && (
                    <span className="px-2 text-sm font-semibold text-slate-400">
                      ...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange?.(pageNumber)}
                    disabled={isLoading}
                    className={clsx(
                      "h-9 min-w-9 rounded-lg px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                      pageNumber === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                  >
                    {pageNumber}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="text-sm font-bold text-slate-600 dark:text-slate-300 sm:hidden">
            Trang {page} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => onPageChange?.(page + 1)}
            disabled={isLoading || page >= totalPages}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="sm:hidden">Sau</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
