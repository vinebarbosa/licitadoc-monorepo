import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEmptyOrganizationFormData, OrganizationOnboardingView } from "@/modules/onboarding";

const demoUser = {
  email: "maria.santos@prefeitura.sp.gov.br",
  fullName: "Maria da Silva Santos",
};

export function OnboardingOrganizationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(createEmptyOrganizationFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <OrganizationOnboardingView
      email={demoUser.email}
      fullName={demoUser.fullName}
      formData={formData}
      isSubmitting={isSubmitting}
      backHref="/demo/onboarding/perfil?role=admin"
      onFormDataChange={setFormData}
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        navigate("/demo/onboarding/concluido?role=admin");
      }}
    />
  );
}
