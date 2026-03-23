import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/utils";

export function Modal({ open, title, children, onClose, className }) {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl",
          className
        )}
      >
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body
  );
}