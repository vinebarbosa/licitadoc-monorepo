import { useLocation } from "react-router-dom";
import { useAuthSession } from "@/modules/auth";
import { CompletionOnboardingView } from "../ui/onboarding-views";

type CompletionLocationState = {
  organizationName?: string;
};

export function OnboardingCompletePage() {
  const location = useLocation();
  const { session, role } = useAuthSession();
  const state = location.state as CompletionLocationState | null;
  const onboardingRole = role === "organization_owner" ? "organization_owner" : "member";

  return (
    <CompletionOnboardingView
      role={onboardingRole}
      fullName={session?.user.name ?? ""}
      email={session?.user.email ?? ""}
      organizationName={state?.organizationName ?? null}
      continueHref="/app"
    />
  );
}
