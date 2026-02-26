import { Navigate, useLocation } from "react-router-dom";
import { getStoredToken } from "../api";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
