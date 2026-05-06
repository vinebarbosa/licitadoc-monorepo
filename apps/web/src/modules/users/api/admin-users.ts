import {
  type GetApiOrganizationsQueryResponse,
  type GetApiUsersQueryParams,
  type GetApiUsersQueryResponse,
  getApiOrganizationsQueryKey,
  getApiUsersQueryKey,
  type PatchApiUsersUseridMutationRequest,
  type PostApiInvitesMutationRequest,
  useDeleteApiUsersUserid,
  useGetApiOrganizations,
  useGetApiUsers,
  usePatchApiUsersUserid,
  usePostApiInvites,
} from "@licitadoc/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type AdminUsersListResponse = GetApiUsersQueryResponse;
export type AdminOrganizationsListResponse = GetApiOrganizationsQueryResponse;
export type AdminUserUpdateRequest = PatchApiUsersUseridMutationRequest;
export type AdminInviteCreateRequest = PostApiInvitesMutationRequest;

export function useAdminUsersList(params: GetApiUsersQueryParams) {
  return useGetApiUsers({ params });
}

export function useAdminOrganizationsList() {
  return useGetApiOrganizations({ params: { page: 1, pageSize: 100 } });
}

export function useCreateOrganizationOwnerInvite() {
  const queryClient = useQueryClient();

  return usePostApiInvites({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getApiUsersQueryKey() });
      },
    },
  });
}

export function useAdminUserUpdate() {
  const queryClient = useQueryClient();

  return usePatchApiUsersUserid({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getApiUsersQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getApiOrganizationsQueryKey() }),
        ]);
      },
    },
  });
}

export function useAdminUserDelete() {
  const queryClient = useQueryClient();

  return useDeleteApiUsersUserid({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getApiUsersQueryKey() });
      },
    },
  });
}
