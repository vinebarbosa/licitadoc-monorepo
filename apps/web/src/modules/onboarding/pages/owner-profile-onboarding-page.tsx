import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage, getOnboardingRedirectTarget, useAuthSession } from "@/modules/auth";
import {
  invalidateSession,
  updateSessionUserAfterProfile,
  useCompleteOwnerProfile,
} from "../api/use-owner-onboarding";
import { ProfileOnboardingView, type ProfileFormData } from "../ui/onboarding-views";

function getInitialFormData(name?: string | null): ProfileFormData {
  return {
    fullName: name ?? "",
    password: "",
    confirmPassword: "",
  };
}

export function OwnerProfileOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, role } = useAuthSession();
  const completeProfile = useCompleteOwnerProfile();
  const [formData, setFormData] = useState<ProfileFormData>(() =>
    getInitialFormData(session?.user.name),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const onboardingRole = role === "organization_owner" ? "organization_owner" : "member";

  return (
    <ProfileOnboardingView
      role={onboardingRole}
      email={session?.user.email ?? ""}
      temporaryName={session?.user.name ?? ""}
      formData={formData}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      isSubmitting={completeProfile.isPending}
      errorMessage={errorMessage}
      onFormDataChange={setFormData}
      onTogglePassword={() => setShowPassword((value) => !value)}
      onToggleConfirmPassword={() => setShowConfirmPassword((value) => !value)}
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);

        try {
          const user = await completeProfile.mutateAsync({
            data: {
              name: formData.fullName.trim(),
              password: formData.password,
            },
          });

          updateSessionUserAfterProfile(queryClient, user);
          await invalidateSession(queryClient);

          const nextTarget =
            getOnboardingRedirectTarget(user.onboardingStatus, user.role) ?? "/onboarding/concluido";

          navigate(nextTarget, { replace: true });
        } catch (error) {
          setErrorMessage(
            getAuthErrorMessage(error, "Não foi possível concluir seu perfil agora."),
          );
        }
      }}
    />
  );
}
