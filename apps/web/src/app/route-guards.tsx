import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  type AuthOnboardingStatus,
  type AuthRole,
  getOnboardingRedirectTarget,
} from "@/modules/auth";

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

type OnboardingGateProps = {
  children: ReactNode;
  onboardingStatus: AuthOnboardingStatus | null;
  role?: AuthRole | null;
};

export function RequireCompletedOnboarding({
  children,
  onboardingStatus,
  role,
}: OnboardingGateProps) {
  const location = useLocation();
  const onboardingTarget = getOnboardingRedirectTarget(onboardingStatus, role);

  if (onboardingTarget && location.pathname !== onboardingTarget) {
    return <Navigate to={onboardingTarget} replace />;
  }

  return children;
}

type RequireOnboardingStepProps = OnboardingGateProps & {
  expectedStatus: AuthOnboardingStatus;
};

export function RequireOnboardingStep({
  children,
  expectedStatus,
  onboardingStatus,
  role,
}: RequireOnboardingStepProps) {
  const onboardingTarget = getOnboardingRedirectTarget(onboardingStatus, role);

  if (!onboardingTarget) {
    return <Navigate to="/app" replace />;
  }

  if (onboardingStatus !== expectedStatus) {
    return <Navigate to={onboardingTarget} replace />;
  }

  return children;
}
