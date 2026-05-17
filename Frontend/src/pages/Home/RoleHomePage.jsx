import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import UserHome from "../user/UserHome";
import StaffHome from "../staff/StaffHome";
import AdminHome from "../admin/AdminHome";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

const RoleHomePage = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-lg p-8" aria-busy="true" aria-label="Đang tải">
        <SkeletonLoader variant="text" count={4} />
      </div>
    );
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