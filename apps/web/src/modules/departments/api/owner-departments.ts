import {
  client,
  type Client,
  type GetApiDepartmentsQueryResponse,
  getApiDepartmentsQueryKey,
  type PatchApiDepartmentsDepartmentidMutationRequest,
  type PatchApiDepartmentsDepartmentidMutationResponse,
  type PostApiDepartmentsMutationRequest,
  type PostApiDepartmentsMutationResponse,
  type RequestConfig,
  type ResponseErrorConfig,
  useGetApiDepartments,
  usePatchApiDepartmentsDepartmentid,
  usePostApiDepartments,
} from "@licitadoc/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type OwnerDepartmentsListResponse = GetApiDepartmentsQueryResponse;
export type OwnerDepartmentListItem = OwnerDepartmentsListResponse["items"][number];
export type OwnerDepartmentCreateRequest = PostApiDepartmentsMutationRequest;
export type OwnerDepartmentCreateResponse = PostApiDepartmentsMutationResponse;
export type OwnerDepartmentUpdateRequest = PatchApiDepartmentsDepartmentidMutationRequest;
export type OwnerDepartmentUpdateResponse = PatchApiDepartmentsDepartmentidMutationResponse;

export const OWNER_DEPARTMENTS_PAGE_SIZE = 100;

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

export function useOwnerDepartmentsList() {
  return useGetApiDepartments({
    params: { page: 1, pageSize: OWNER_DEPARTMENTS_PAGE_SIZE },
  });
}

export function useOwnerDepartmentCreate() {
  const queryClient = useQueryClient();

  return usePostApiDepartments({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getApiDepartmentsQueryKey() });
      },
    },
    client: { client: rejectingClient },
  });
}

export function useOwnerDepartmentUpdate() {
  const queryClient = useQueryClient();

  return usePatchApiDepartmentsDepartmentid({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getApiDepartmentsQueryKey() });
      },
    },
    client: { client: rejectingClient },
  });
}
