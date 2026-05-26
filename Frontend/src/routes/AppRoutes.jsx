import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PageLoader from "../components/ui/PageLoader";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const LogoutPage = lazy(() => import("../pages/auth/LogoutPage"));
const ProfileForm = lazy(() => import("../features/auth/components/ProfileForm"));
const RoleHomePage = lazy(() => import("../pages/Home/RoleHomePage"));
const HomePage = lazy(() => import("../pages/Home/HomePage"));
const StaffBookingPage = lazy(() => import("../pages/staff/StaffBookingPage"));
const CustomerBookingPage = lazy(() => import("../pages/user/CustomerBookingPage"));
const MyBookingPage = lazy(() => import("../pages/user/MyBookingPage"));
const StaffBookingHistoryPage = lazy(() => import("../pages/staff/StaffBookingHistoryPage"));
const StaffCheckoutPage = lazy(() => import("../pages/staff/StaffCheckoutPage"));
const StaffPosProductsPage = lazy(() => import("../pages/staff/StaffPosProductsPage"));
const StaffOrderDetailPage = lazy(() => import("../pages/staff/StaffOrderDetailPage"));
const PaymentResultPage = lazy(() => import("../pages/payment/PaymentResultPage"));
const PaymentRedirectPage = lazy(() => import("../pages/payment/PaymentRedirectPage"));

//admin
const AdminBranchPage = lazy(() => import("../pages/admin/AdminBranchPage"));
const AdminCourtsPage = lazy(() => import("../pages/admin/AdminCourtPage"));
const AdminStaffPage = lazy(() => import("../pages/admin/AdminStaffPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const UITestPage = lazy(() => import("../pages/dev/UITestPage"));
const UnauthorizedPage = lazy(() => import("../pages/error/UnauthorizedPage"));
const NotFoundPage = lazy(() => import("../pages/error/NotFoundPage"));

const AppRouteContent = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-transition">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dev/ui-test" element={<UITestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/booking" element={<CustomerBookingPage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
          <Route
            path="/payment/:bookingId"
            element={
              <ProtectedRoute>
                <PaymentRedirectPage />
              </ProtectedRoute>
            }
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
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingPage />
              </ProtectedRoute>
            }
          />
          {/* STAFF */}
          <Route
            path="/staff/booking"
            element={
              <ProtectedRoute roles={["admin", "staff"]}>
                <StaffBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/checkout/:bookingId"
            element={
              <ProtectedRoute roles={["admin", "staff"]}>
                <StaffCheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={["admin", "staff"]}>
                <StaffPosProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={["admin", "staff"]}>
                <StaffPosProductsPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN */}
         
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
            <Route
              path="/admin/booking-history"
              element={
                <ProtectedRoute roles={["admin", "staff"]}>
                  <StaffBookingHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders/:orderId"
              element={
                <ProtectedRoute roles={["admin", "staff"]}>
                  <StaffOrderDetailPage />
                </ProtectedRoute>
              }
            />

          <Route path="/403" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
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
