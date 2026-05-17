import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SkeletonLoader from "../components/ui/SkeletonLoader";

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <SkeletonLoader variant="text" count={3} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/403" />;
  }

  return children;
};

export default ProtectedRoute;