import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../components/base/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

type AccessLevel = "authenticated" | "host" | "admin";

interface AccessRouteProps {
  children: ReactNode;
  level?: AccessLevel;
}

export default function AccessRoute({
  children,
  level = "authenticated",
}: AccessRouteProps) {
  const { loading, isAuthenticated, isHost, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  const hasAccess =
    isAuthenticated &&
    (level === "authenticated" ||
      (level === "host" && isHost) ||
      (level === "admin" && isAdmin));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}
