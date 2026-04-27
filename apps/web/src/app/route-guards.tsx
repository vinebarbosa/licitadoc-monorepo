import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type RequireSessionProps = {
  children: ReactNode;
  isLoading?: boolean;
  isAuthenticated: boolean;
  isAuthorized?: boolean;
  redirectTo?: string;
  unauthorizedTo?: string;
  loadingFallback?: ReactNode;
};

export function RequireSession({
  children,
  isLoading = false,
  isAuthenticated,
  isAuthorized = true,
  redirectTo = "/entrar",
  unauthorizedTo = "/nao-autorizado",
  loadingFallback = null,
}: RequireSessionProps) {
  const location = useLocation();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    const attemptedPath = `${location.pathname}${location.search}`;
    const signInPath = redirectTo.includes("?")
      ? redirectTo
      : `${redirectTo}?redirectTo=${encodeURIComponent(attemptedPath)}`;

    return <Navigate to={signInPath} replace />;
  }

  if (!isAuthorized) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  return children;
}
