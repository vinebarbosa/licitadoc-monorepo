import {
  client,
  type GetApiDepartmentsQueryResponse,
  type GetApiOrganizationsQueryResponse,
  type GetApiProcessesProcessidQueryResponse,
  type GetApiProcessesQueryParams,
  type GetApiProcessesQueryResponse,
  getApiProcessesProcessidQueryKey,
  getApiProcessesQueryKey,
  type PostApiProcessesMutationRequest,
  type PostApiProcessesMutationResponse,
  type ResponseErrorConfig,
  useGetApiDepartments,
  useGetApiOrganizations,
  useGetApiProcesses,
} from "@licitadoc/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ProcessesListResponse = GetApiProcessesQueryResponse;
export type ProcessesListItem = ProcessesListResponse["items"][number];
export type ProcessesListQueryParams = GetApiProcessesQueryParams;
export type ProcessDetailResponse = GetApiProcessesProcessidQueryResponse;
export type ProcessDetailDocument = ProcessDetailResponse["documents"][number];
export type ProcessCreateRequest = PostApiProcessesMutationRequest;
export type ProcessCreateResponse = PostApiProcessesMutationResponse;
export type ProcessDepartmentListResponse = GetApiDepartmentsQueryResponse;
export type ProcessDepartmentListItem = ProcessDepartmentListResponse["items"][number];
export type ProcessOrganizationListResponse = GetApiOrganizationsQueryResponse;
export type ProcessOrganizationListItem = ProcessOrganizationListResponse["items"][number];

export function useProcessesList(params: ProcessesListQueryParams) {
  return useGetApiProcesses({ params });
}

export function useProcessDetail(processId: string) {
  return useQuery<ProcessDetailResponse, ResponseErrorConfig<{ message?: string }>>({
    enabled: processId.length > 0,
    queryKey: getApiProcessesProcessidQueryKey({ processId }),
    retry: false,
    queryFn: async () => {
      const response = await client<
        ProcessDetailResponse,
        ResponseErrorConfig<{ message?: string }>,
        never
      >({
        method: "GET",
        url: `http://localhost:3333/api/processes/${processId}`,
      });

      if (response.status >= 400) {
        throw {
          data: response.data,
          headers: response.headers,
          status: response.status,
        } satisfies ResponseErrorConfig;
      }

      return response.data;
    },
  });
}

export function useProcessDepartmentsList() {
  return useGetApiDepartments({ params: { page: 1, pageSize: 100 } });
}

export function useProcessOrganizationsList(enabled: boolean) {
  return useGetApiOrganizations({ params: { page: 1, pageSize: 100 } }, { query: { enabled } });
}

export function useProcessCreate() {
  const queryClient = useQueryClient();

  return useMutation<
    ProcessCreateResponse,
    ResponseErrorConfig<{ message?: string }>,
    { data: ProcessCreateRequest }
  >({
    mutationFn: async ({ data }) => {
      const response = await client<
        ProcessCreateResponse,
        ResponseErrorConfig<{ message?: string }>,
        ProcessCreateRequest
      >({
        method: "POST",
        url: "http://localhost:3333/api/processes/",
        data,
      });

      if (response.status >= 400) {
        throw {
          data: response.data,
          headers: response.headers,
          status: response.status,
        } satisfies ResponseErrorConfig;
      }

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getApiProcessesQueryKey() });
    },
  });
}
