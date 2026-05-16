import { useSearchParams } from "react-router-dom";
import { CompletionOnboardingView } from "@/modules/onboarding";

const demoOrgAdmin = {
  fullName: "Maria da Silva Santos",
  email: "maria.santos@prefeitura.sp.gov.br",
  organization: "Prefeitura Municipal de São Paulo",
};

const demoMember = {
  fullName: "João Pedro Oliveira",
  email: "joao.oliveira@prefeitura.sp.gov.br",
  organization: "Prefeitura Municipal de São Paulo",
};

export function OnboardingCompletePage() {
  const [searchParams] = useSearchParams();
  const isOrgAdmin = searchParams.get("role") === "admin";
  const user = isOrgAdmin ? demoOrgAdmin : demoMember;

  return (
    <CompletionOnboardingView
      role={isOrgAdmin ? "organization_owner" : "member"}
      fullName={user.fullName}
      email={user.email}
      organizationName={user.organization}
      continueHref="/app"
    />
  );
}
