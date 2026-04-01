import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import UserHome from "../user/UserHome";
import StaffHome from "../staff/StaffHome";
import AdminHome from "../admin/AdminHome";

const RoleHomePage = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin" || user.role === "super_admin") {
    return <AdminHome />;
  }

  if (user.role === "staff") {
    return <StaffHome />;
  }

  return <UserHome user={user} />;
};

export default RoleHomePage;