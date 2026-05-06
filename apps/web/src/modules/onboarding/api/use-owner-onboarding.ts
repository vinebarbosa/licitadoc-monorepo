import {
  type GetSessionQueryResponse,
  getSessionQueryKey,
  type PostApiOrganizationsMutationRequest,
  usePostApiOrganizations,
  usePostApiUsersMeOnboardingProfile,
} from "@licitadoc/api-client";
import type { QueryClient } from "@tanstack/react-query";

type OwnerProfileUser = Awaited<
  ReturnType<ReturnType<typeof usePostApiUsersMeOnboardingProfile>["mutateAsync"]>
>;

type OwnerOrganization = Awaited<
  ReturnType<ReturnType<typeof usePostApiOrganizations>["mutateAsync"]>
>;

export type OwnerOrganizationInput = PostApiOrganizationsMutationRequest;

export function useCompleteOwnerProfile() {
  return usePostApiUsersMeOnboardingProfile();
}

export function useCompleteOwnerOrganization() {
  return usePostApiOrganizations();
}

export function updateSessionUserAfterProfile(queryClient: QueryClient, user: OwnerProfileUser) {
  queryClient.setQueryData<GetSessionQueryResponse>(getSessionQueryKey(), (currentSession) =>
    currentSession
      ? {
          ...currentSession,
          user: {
            ...currentSession.user,
            ...user,
            image: user.image ?? undefined,
            organizationId: user.organizationId ?? undefined,
          },
        }
      : currentSession,
  );
}

export function updateSessionUserAfterOrganization(
  queryClient: QueryClient,
  organization: OwnerOrganization,
) {
  queryClient.setQueryData<GetSessionQueryResponse>(getSessionQueryKey(), (currentSession) =>
    currentSession
      ? {
          ...currentSession,
          user: {
            ...currentSession.user,
            onboardingStatus: "complete",
            organizationId: organization.id,
          },
        }
      : currentSession,
  );
}

export async function invalidateSession(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: getSessionQueryKey() });
}
