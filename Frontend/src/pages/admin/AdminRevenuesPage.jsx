import React from "react";
import { useAuthStore } from "../../store/authStore";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import RevenueDashboard from "../../features/revenues/components/RevenueDashboard";

const AdminRevenuesPage = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || "customer";

  // Tự động sử dụng AdminLayout cho admin, và StaffLayout cho staff/manager
  const Layout = userRole === "admin" ? AdminLayout : StaffLayout;

  return (
    <Layout>
      <RevenueDashboard />
    </Layout>
  );
};

export default AdminRevenuesPage;
