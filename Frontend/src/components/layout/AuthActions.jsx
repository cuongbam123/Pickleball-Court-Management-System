import React from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";

const AuthActions = ({ user, mobile = false, onItemClick }) => {
  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isStaff = user?.role === "staff";

  if (!isAuthenticated) {
    return (
      <div className={mobile ? "flex w-full flex-col gap-2" : "hidden items-center gap-3 lg:flex"}>
        <Button as={Link} to="/login" variant="ghost" onClick={onItemClick}>
          Đăng nhập
        </Button>
        <Button as={Link} to="/register" onClick={onItemClick}>
          Đăng ký
        </Button>
      </div>
    );
  }

  return (
    <div className={mobile ? "flex w-full flex-col gap-2" : "hidden items-center gap-3 lg:flex"}>
      {(isAdmin || isStaff) && (
        <Button as={Link} to="/dashboard" variant="secondary" onClick={onItemClick}>
          Dashboard
        </Button>
      )}

      <Link
        to="/profile"
        onClick={onItemClick}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
          {(user?.full_name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="text-left">
          <p className="text-sm font-semibold text-slate-900">
            {user?.full_name || "Người dùng"}
          </p>
          <p className="text-xs capitalize text-slate-500">
            {user?.role || "customer"}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default AuthActions;