import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import UserHome from "../user/UserHome";
import StaffHome from "../staff/StaffHome";
import AdminHome from "../admin/AdminHome";
import Spiral from "../../components/ui/Spiral";

const RoleHomePage = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Spiral size="lg" className="text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin" || user.role === "super_admin") {
    return <AdminHome />;
  }

  if (user.role === "staff" || user.role === "manager") {
    return <StaffHome />;
  }

  return <UserHome user={user} />;
};

export default RoleHomePage;