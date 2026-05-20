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
  isAcceptedOrganizationLetterheadImage,
  normalizeSlug,
  ORGANIZATION_LETTERHEAD_MAX_BYTES,
  OrganizationOnboardingView,
} from "../ui/onboarding-views";

function getLetterheadValidationError(files: FileList | null) {
  const selectedFiles = Array.from(files ?? []);

  if (selectedFiles.length === 0) {
    return null;
  }

  if (selectedFiles.length > 1) {
    return "Envie apenas uma imagem de papel timbrado.";
  }

  const file = selectedFiles[0];

  if (!file) {
    return null;
  }

  if (!isAcceptedOrganizationLetterheadImage(file)) {
    return "Envie uma imagem PNG, JPEG ou WebP.";
  }

  if (file.size === 0) {
    return "A imagem não pode estar vazia.";
  }

  if (file.size > ORGANIZATION_LETTERHEAD_MAX_BYTES) {
    return "A imagem precisa ter até 5 MB.";
  }

  return null;
}

export function OwnerOrganizationOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const completeOrganization = useCompleteOwnerOrganization();
  const [formData, setFormData] = useState(createEmptyOrganizationFormData);
  const [letterheadFile, setLetterheadFile] = useState<File | null>(null);
  const [letterheadError, setLetterheadError] = useState<string | null>(null);
  const [letterheadInputKey, setLetterheadInputKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <OrganizationOnboardingView
      email={session?.user.email ?? ""}
      fullName={session?.user.name ?? ""}
      formData={formData}
      letterheadError={letterheadError}
      letterheadFile={letterheadFile}
      letterheadInputKey={letterheadInputKey}
      isSubmitting={completeOrganization.isPending}
      errorMessage={errorMessage}
      backHref="/onboarding/perfil"
      onFormDataChange={setFormData}
      onLetterheadChange={(files) => {
        const validationError = getLetterheadValidationError(files);
        const [selectedFile] = Array.from(files ?? []);

        setLetterheadError(validationError);
        setLetterheadFile(validationError ? null : (selectedFile ?? null));
      }}
      onRemoveLetterhead={() => {
        setLetterheadFile(null);
        setLetterheadError(null);
        setLetterheadInputKey((currentKey) => currentKey + 1);
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);

        if (letterheadError) {
          return;
        }

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
              letterhead: letterheadFile ?? undefined,
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
