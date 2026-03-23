import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import UIComponentsDemo from "../pages/UIComponentsDemo";
import TableSwitchDemo from "../pages/TableSwitchDemo";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <div>Admin Page</div>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<div>Home</div>} />
        <Route path="/ui-demo" element={<UIComponentsDemo />} />
        <Route path="/table-demo" element={<TableSwitchDemo />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;