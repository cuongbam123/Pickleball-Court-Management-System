import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import LogoutPage from "../pages/auth/LogoutPage";
// import TestUI from "../pages/TestUI";
import ProfileForm from "./../features/auth/components/ProfileForm";
import RoleHomePage from "../pages/Home/RoleHomePage";
import HomePage from "../pages/Home/HomePage";

//admin
import AdminHome from "../pages/admin/AdminHome";
import AdminBranchPage from "../pages/admin/AdminBranchPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/logout" element={<LogoutPage />} />
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
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
