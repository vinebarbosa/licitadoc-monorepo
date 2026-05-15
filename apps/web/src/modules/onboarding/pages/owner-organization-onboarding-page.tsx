import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage, useAuthSession } from "@/modules/auth";
import {
  invalidateSession,
  updateSessionUserAfterOrganization,
  useCompleteOwnerOrganization,
} from "../api/use-owner-onboarding";
import {
  createEmptyOrganizationFormData,
  normalizeSlug,
  OrganizationOnboardingView,
} from "../ui/onboarding-views";

export function OwnerOrganizationOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const completeOrganization = useCompleteOwnerOrganization();
  const [formData, setFormData] = useState(createEmptyOrganizationFormData);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <OrganizationOnboardingView
      email={session?.user.email ?? ""}
      fullName={session?.user.name ?? ""}
      formData={formData}
      isSubmitting={completeOrganization.isPending}
      errorMessage={errorMessage}
      backHref="/onboarding/perfil"
      onFormDataChange={setFormData}
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);

        try {
          const organization = await completeOrganization.mutateAsync({
            data: {
              name: formData.name.trim(),
              slug: normalizeSlug(formData.slug || formData.name),
              officialName: formData.officialName.trim(),
              cnpj: formData.cnpj,
              city: formData.city.trim(),
              state: formData.state.trim().toUpperCase(),
              address: formData.address.trim(),
              zipCode: formData.cep,
              phone: formData.phone,
              institutionalEmail: formData.email.trim(),
              website: formData.website.trim() || null,
              logoUrl: null,
              authorityName: formData.authorityName.trim(),
              authorityRole: formData.authorityRole.trim(),
            },
          });

          updateSessionUserAfterOrganization(queryClient, organization);
          await invalidateSession(queryClient);

          navigate("/onboarding/concluido", {
            replace: true,
            state: { organizationName: organization.name },
          });
        } catch (error) {
          setErrorMessage(
            getAuthErrorMessage(error, "Não foi possível salvar a organização agora."),
          );
        }
      }}
    />
  );
}
