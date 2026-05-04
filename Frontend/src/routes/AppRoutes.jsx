import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import LogoutPage from "../pages/auth/LogoutPage";
// import TestUI from "../pages/TestUI";
import ProfileForm from "./../features/auth/components/ProfileForm";
import RoleHomePage from "../pages/Home/RoleHomePage";
import HomePage from "../pages/Home/HomePage";
import StaffBookingPage from "../pages/staff/StaffBookingPage";

//admin
import AdminHome from "../pages/admin/AdminHome";
import AdminBranchPage from "../pages/admin/AdminBranchPage";
import AdminCourtsPage from "../pages/admin/AdminCourtPage";
import AdminStaffPage from "../pages/admin/AdminStaffPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";

const AppRouteContent = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-transition">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/logout" element={<LogoutPage />} />

        <Route
          path="/booking"
          element={<StaffBookingPage />} 
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <RoleHomePage />
            </ProtectedRoute>
          }
        />

        //ADMIN
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminHome /> 
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminBranchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courts"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminCourtsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <AdminStaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/test-ui" element={<TestUI />} /> */}
      </Routes>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AppRouteContent />
    </BrowserRouter>
  );
};

export default AppRoutes;
