import {
  client,
  type GetApiDepartmentsQueryResponse,
  type GetApiOrganizationsMeQueryResponse,
  type GetApiOrganizationsQueryResponse,
  type GetApiProcessesProcessidQueryResponse,
  type GetApiProcessesQueryParams,
  type GetApiProcessesQueryResponse,
  getApiOrganizationsMeQueryKey,
  getApiProcessesProcessidQueryKey,
  getApiProcessesQueryKey,
  type PatchApiProcessesProcessidMutationRequest,
  type PatchApiProcessesProcessidMutationResponse,
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
export type ProcessUpdateRequest = PatchApiProcessesProcessidMutationRequest;
export type ProcessUpdateResponse = PatchApiProcessesProcessidMutationResponse;
export type ProcessDepartmentListResponse = GetApiDepartmentsQueryResponse;
export type ProcessDepartmentListItem = ProcessDepartmentListResponse["items"][number];
export type ProcessOrganizationListResponse = GetApiOrganizationsQueryResponse;
export type ProcessOrganizationListItem = ProcessOrganizationListResponse["items"][number];
export type ProcessCurrentOrganizationResponse = GetApiOrganizationsMeQueryResponse;

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

export function useCurrentProcessOrganization(enabled: boolean) {
  return useQuery<ProcessCurrentOrganizationResponse, ResponseErrorConfig<{ message?: string }>>({
    enabled,
    queryKey: getApiOrganizationsMeQueryKey(),
    retry: false,
    queryFn: async () => {
      const response = await client<
        ProcessCurrentOrganizationResponse,
        ResponseErrorConfig<{ message?: string }>,
        never
      >({
        method: "GET",
        url: "http://localhost:3333/api/organizations/me",
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

export function useProcessUpdate(processId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ProcessUpdateResponse,
    ResponseErrorConfig<{ message?: string }>,
    { data: ProcessUpdateRequest }
  >({
    mutationFn: async ({ data }) => {
      const response = await client<
        ProcessUpdateResponse,
        ResponseErrorConfig<{ message?: string }>,
        ProcessUpdateRequest
      >({
        method: "PATCH",
        url: `http://localhost:3333/api/processes/${processId}`,
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getApiProcessesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getApiProcessesProcessidQueryKey({ processId }) }),
      ]);
    },
  });
}
