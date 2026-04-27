import {
  type GetSessionQueryResponse,
  getSessionQueryKey,
  type SignInEmailMutationResponse,
  useRequestPasswordReset as useGeneratedRequestPasswordReset,
  useSignInEmail as useGeneratedSignInEmail,
  useSignOut as useGeneratedSignOut,
  useGetSession,
} from "@licitadoc/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type AuthRole = "admin" | "organization_owner" | "member";

export type AuthSession = NonNullable<GetSessionQueryResponse>;

function normalizeRole(value?: string | null): AuthRole | null {
  if (value === "admin" || value === "organization_owner" || value === "member") {
    return value;
  }

  return null;
}

export function getAuthRedirectTarget(input?: string | null) {
  if (!input?.startsWith("/") || input.startsWith("//")) {
    return "/app";
  }

  return input;
}

export function getAuthErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string" &&
    error.data.message.length > 0
  ) {
    return error.data.message;
  }

  return fallbackMessage;
}

export function getAuthResponseMessage(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "message" in response &&
    typeof response.message === "string" &&
    response.message.length > 0
  ) {
    return response.message;
  }

  return null;
}

export function hasRequiredRole(role: AuthRole | null, allowedRoles?: AuthRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return role !== null && allowedRoles.includes(role);
}

export function isSuccessfulSignInResponse(
  response: unknown,
): response is SignInEmailMutationResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "token" in response &&
    typeof response.token === "string" &&
    "user" in response &&
    typeof response.user === "object" &&
    response.user !== null
  );
}

export function useAuthSession() {
  const sessionQuery = useGetSession();
  const session = sessionQuery.data ?? null;
  const role = normalizeRole(session?.user.role);

  return {
    ...sessionQuery,
    session,
    role,
    organizationId: session?.user.organizationId ?? null,
    isAuthenticated: Boolean(session?.user),
  };
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useGeneratedSignInEmail({
    mutation: {
      onSuccess: (response) => {
        if (!isSuccessfulSignInResponse(response)) {
          return;
        }

        queryClient.setQueryData<GetSessionQueryResponse>(getSessionQueryKey(), {
          session: {
            token: response.token,
            userId: response.user.id ?? "",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          user: response.user,
        });
      },
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useGeneratedSignOut({
    mutation: {
      onSuccess: async () => {
        queryClient.setQueryData(getSessionQueryKey(), null);
        await queryClient.invalidateQueries({ queryKey: getSessionQueryKey() });
      },
    },
  });
}

export function usePasswordResetRequest() {
  return useGeneratedRequestPasswordReset();
}
