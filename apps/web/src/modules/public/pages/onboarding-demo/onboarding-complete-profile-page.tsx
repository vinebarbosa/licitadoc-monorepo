import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { type ProfileFormData, ProfileOnboardingView } from "@/modules/onboarding";

const demoUser = {
  email: "maria.santos@prefeitura.sp.gov.br",
  tempName: "Maria",
};

export function OnboardingCompleteProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOrgAdmin = searchParams.get("role") === "admin";
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ProfileOnboardingView
      role={isOrgAdmin ? "organization_owner" : "member"}
      email={demoUser.email}
      temporaryName={demoUser.tempName}
      formData={formData}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      isSubmitting={isSubmitting}
      onFormDataChange={setFormData}
      onTogglePassword={() => setShowPassword((value) => !value)}
      onToggleConfirmPassword={() => setShowConfirmPassword((value) => !value)}
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate(isOrgAdmin ? "/demo/onboarding/organizacao" : "/demo/onboarding/concluido");
      }}
    />
  );
}
