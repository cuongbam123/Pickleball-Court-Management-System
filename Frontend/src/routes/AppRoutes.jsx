import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import LogoutPage from "../pages/auth/LogoutPage";
import TestUI from "../pages/TestUI";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/LogoutPage" element={<LogoutPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <div>Admin Page</div>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<div>Home</div>} />
        <Route path="/test" element={<TestUI />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;