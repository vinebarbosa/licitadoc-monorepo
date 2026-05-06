import {
  type GetApiUsersQueryResponse,
  getApiInvitesQueryKey,
  getApiUsersQueryKey,
  type PatchApiUsersUseridMutationRequest,
  type PostApiInvitesMutationRequest,
  type PostApiInvitesMutationResponse,
  useDeleteApiUsersUserid,
  useGetApiUsers,
  usePatchApiUsersUserid,
  usePostApiInvites,
} from "@licitadoc/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type OwnerMembersListResponse = GetApiUsersQueryResponse;
export type OwnerMemberUpdateRequest = PatchApiUsersUseridMutationRequest;
export type OwnerMemberInviteRequest = PostApiInvitesMutationRequest;
export type OwnerMemberInviteResponse = PostApiInvitesMutationResponse;

export const OWNER_MEMBERS_PAGE_SIZE = 20;

export function useOwnerMembersList() {
  return useGetApiUsers({
    params: { page: 1, pageSize: OWNER_MEMBERS_PAGE_SIZE, role: "member" },
  });
}

export function useOwnerCreateMemberInvite() {
  const queryClient = useQueryClient();

  return usePostApiInvites({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getApiInvitesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getApiUsersQueryKey() }),
        ]);
      },
    },
  });
}

export function useOwnerMemberUpdate() {
  const queryClient = useQueryClient();

  return usePatchApiUsersUserid({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getApiUsersQueryKey() });
      },
    },
  });
}

export function useOwnerMemberDelete() {
  const queryClient = useQueryClient();

  return useDeleteApiUsersUserid({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getApiUsersQueryKey() });
      },
    },
  });
}
