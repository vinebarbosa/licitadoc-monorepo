import {
  type Client,
  client,
  type DeleteApiDepartmentsDepartmentidMutationResponse,
  type DeleteApiUsersUseridMutationResponse,
  type GetApiDepartmentsQueryResponse,
  type GetApiInvitesQueryResponse,
  type GetApiOrganizationsMeQueryResponse,
  type GetApiUsersQueryResponse,
  getApiDepartmentsQueryKey,
  getApiInvitesQueryKey,
  getApiOrganizationsMeQueryKey,
  getApiUsersQueryKey,
  type PatchApiDepartmentsDepartmentidMutationRequest,
  type PatchApiDepartmentsDepartmentidMutationResponse,
  type PatchApiInvitesInviteidRevokeMutationResponse,
  type PatchApiOrganizationsOrganizationidMutationRequest,
  type PatchApiOrganizationsOrganizationidMutationResponse,
  type PostApiDepartmentsMutationRequest,
  type PostApiDepartmentsMutationResponse,
  type PostApiInvitesInviteidResendMutationResponse,
  type PostApiInvitesMutationRequest,
  type PostApiInvitesMutationResponse,
  type PostApiOrganizationsOrganizationidCrestMutationRequest,
  type PostApiOrganizationsOrganizationidCrestMutationResponse,
  type PostApiOrganizationsOrganizationidLetterheadMutationRequest,
  type PostApiOrganizationsOrganizationidLetterheadMutationResponse,
  type PostApiOrganizationsOrganizationidLetterheadTemplateMutationRequest,
  type PostApiOrganizationsOrganizationidLetterheadTemplateMutationResponse,
  type PostApiOrganizationsOrganizationidLogoMutationRequest,
  type PostApiOrganizationsOrganizationidLogoMutationResponse,
  type RequestConfig,
  type ResponseErrorConfig,
  useDeleteApiDepartmentsDepartmentid,
  useDeleteApiUsersUserid,
  useGetApiDepartments,
  useGetApiInvites,
  useGetApiOrganizationsMe,
  useGetApiUsers,
  usePatchApiDepartmentsDepartmentid,
  usePatchApiInvitesInviteidRevoke,
  usePatchApiOrganizationsOrganizationid,
  usePostApiDepartments,
  usePostApiInvites,
  usePostApiInvitesInviteidResend,
  usePostApiOrganizationsOrganizationidCrest,
  usePostApiOrganizationsOrganizationidLetterhead,
  usePostApiOrganizationsOrganizationidLetterheadTemplate,
  usePostApiOrganizationsOrganizationidLogo,
} from "@licitadoc/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type OwnerOrganizationProfile = GetApiOrganizationsMeQueryResponse;
export type OwnerOrganizationUpdateRequest = PatchApiOrganizationsOrganizationidMutationRequest;
export type OwnerOrganizationUpdateResponse = PatchApiOrganizationsOrganizationidMutationResponse;

export type OwnerOrganizationMembersResponse = GetApiUsersQueryResponse;
export type OwnerOrganizationMember = OwnerOrganizationMembersResponse["items"][number];
export type OwnerOrganizationMemberDeleteResponse = DeleteApiUsersUseridMutationResponse;

export type OwnerOrganizationInvitesResponse = GetApiInvitesQueryResponse;
export type OwnerOrganizationInvite = OwnerOrganizationInvitesResponse["items"][number];
export type OwnerOrganizationInviteCreateRequest = PostApiInvitesMutationRequest;
export type OwnerOrganizationInviteCreateResponse = PostApiInvitesMutationResponse;
export type OwnerOrganizationInviteResendResponse = PostApiInvitesInviteidResendMutationResponse;
export type OwnerOrganizationInviteRevokeResponse = PatchApiInvitesInviteidRevokeMutationResponse;

export type OwnerOrganizationDepartmentsResponse = GetApiDepartmentsQueryResponse;
export type OwnerOrganizationDepartment = OwnerOrganizationDepartmentsResponse["items"][number];
export type OwnerOrganizationDepartmentCreateRequest = PostApiDepartmentsMutationRequest;
export type OwnerOrganizationDepartmentCreateResponse = PostApiDepartmentsMutationResponse;
export type OwnerOrganizationDepartmentUpdateRequest =
  PatchApiDepartmentsDepartmentidMutationRequest;
export type OwnerOrganizationDepartmentUpdateResponse =
  PatchApiDepartmentsDepartmentidMutationResponse;
export type OwnerOrganizationDepartmentDeleteResponse =
  DeleteApiDepartmentsDepartmentidMutationResponse;

export type OwnerOrganizationLogoUploadRequest =
  PostApiOrganizationsOrganizationidLogoMutationRequest;
export type OwnerOrganizationLogoUploadResponse =
  PostApiOrganizationsOrganizationidLogoMutationResponse;
export type OwnerOrganizationCrestUploadRequest =
  PostApiOrganizationsOrganizationidCrestMutationRequest;
export type OwnerOrganizationCrestUploadResponse =
  PostApiOrganizationsOrganizationidCrestMutationResponse;
export type OwnerOrganizationLetterheadUploadRequest =
  PostApiOrganizationsOrganizationidLetterheadMutationRequest;
export type OwnerOrganizationLetterheadUploadResponse =
  PostApiOrganizationsOrganizationidLetterheadMutationResponse;
export type OwnerOrganizationLetterheadTemplateUploadRequest =
  PostApiOrganizationsOrganizationidLetterheadTemplateMutationRequest;
export type OwnerOrganizationLetterheadTemplateUploadResponse =
  PostApiOrganizationsOrganizationidLetterheadTemplateMutationResponse;

export const OWNER_ORGANIZATION_PAGE_SIZE = 100;

const rejectingClient: Client = async <TData, TError, TVariables>(
  config: RequestConfig<TVariables>,
) => {
  const response = await client<TData, TError, TVariables>(config);

  if (response.status >= 400) {
    throw {
      data: response.data as unknown as TError,
      headers: response.headers,
      status: response.status,
    } satisfies ResponseErrorConfig<TError>;
  }

  return response;
};

export function useOwnerOrganizationProfile() {
  return useGetApiOrganizationsMe();
}

export function useOwnerOrganizationMembers() {
  return useGetApiUsers({
    params: { page: 1, pageSize: OWNER_ORGANIZATION_PAGE_SIZE },
  });
}

export function useOwnerOrganizationInvites() {
  return useGetApiInvites({
    params: { page: 1, pageSize: OWNER_ORGANIZATION_PAGE_SIZE },
  });
}

export function useOwnerOrganizationDepartments() {
  return useGetApiDepartments({
    params: { page: 1, pageSize: OWNER_ORGANIZATION_PAGE_SIZE },
  });
}

function useInvalidateOwnerOrganizationWorkspace() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getApiOrganizationsMeQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getApiUsersQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getApiInvitesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getApiDepartmentsQueryKey() }),
    ]);
  };
}

export function useOwnerOrganizationUpdate() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePatchApiOrganizationsOrganizationid({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationCreateInvite() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePostApiInvites({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationResendInvite() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePostApiInvitesInviteidResend({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationRevokeInvite() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePatchApiInvitesInviteidRevoke({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationDeleteMember() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return useDeleteApiUsersUserid({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationCreateDepartment() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePostApiDepartments({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationUpdateDepartment() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePatchApiDepartmentsDepartmentid({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationDeleteDepartment() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return useDeleteApiDepartmentsDepartmentid({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationUploadLogo() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePostApiOrganizationsOrganizationidLogo({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationUploadCrest() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePostApiOrganizationsOrganizationidCrest({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationUploadLetterhead() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePostApiOrganizationsOrganizationidLetterhead({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerOrganizationUploadLetterheadTemplate() {
  const invalidateWorkspace = useInvalidateOwnerOrganizationWorkspace();

  return usePostApiOrganizationsOrganizationidLetterheadTemplate({
    mutation: {
      onSuccess: invalidateWorkspace,
    },
    client: { client: rejectingClient },
  });
}
