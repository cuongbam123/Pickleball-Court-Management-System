import { forwardRef, useId } from "react";
import { cn } from "../../../lib/utils";

export const Input = forwardRef(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
            error ? "border-red-500" : "border-slate-300",
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : hint ? (
          <p className="text-sm text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";