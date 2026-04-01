import React, { useEffect } from "react";
import Button from "./Button";

const Modal = ({
  open,
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmText = "Xác nhận",
  cancelText = "Đóng",
  confirmVariant = "primary",
  confirmLoading = false,
  closeOnOverlay = true,
  hideFooter = false,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5">{children}</div>

        {!hideFooter ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            {onConfirm ? (
              <Button
                variant={confirmVariant}
                onClick={onConfirm}
                loading={confirmLoading}
              >
                {confirmText}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Modal;
