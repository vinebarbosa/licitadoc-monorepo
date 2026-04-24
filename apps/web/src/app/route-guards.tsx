import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type RequireSessionProps = {
  children: ReactNode;
  isAllowed: boolean;
  redirectTo?: string;
};

export function RequireSession({ children, isAllowed, redirectTo = "/" }: RequireSessionProps) {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
