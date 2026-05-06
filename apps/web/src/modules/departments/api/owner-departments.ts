import {
  type GetApiDepartmentsQueryResponse,
  getApiDepartmentsQueryKey,
  type PostApiDepartmentsMutationRequest,
  type PostApiDepartmentsMutationResponse,
  useGetApiDepartments,
  usePostApiDepartments,
} from "@licitadoc/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type OwnerDepartmentsListResponse = GetApiDepartmentsQueryResponse;
export type OwnerDepartmentListItem = OwnerDepartmentsListResponse["items"][number];
export type OwnerDepartmentCreateRequest = PostApiDepartmentsMutationRequest;
export type OwnerDepartmentCreateResponse = PostApiDepartmentsMutationResponse;

export const OWNER_DEPARTMENTS_PAGE_SIZE = 100;

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
  });
}
