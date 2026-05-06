import {
  client,
  type GetApiDocumentsDocumentidQueryResponse,
  type GetApiDocumentsQueryResponse,
  type GetApiProcessesQueryResponse,
  getApiDocumentsDocumentidQueryKey,
  getApiDocumentsQueryKey,
  type PostApiDocumentsMutationRequest,
  type PostApiDocumentsMutationResponse,
  type ResponseErrorConfig,
  useGetApiDocuments,
  useGetApiProcesses,
} from "@licitadoc/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DocumentsListResponse = GetApiDocumentsQueryResponse;
export type DocumentsListItem = DocumentsListResponse["items"][number];
export type DocumentDetailResponse = GetApiDocumentsDocumentidQueryResponse;
export type DocumentCreateRequest = PostApiDocumentsMutationRequest;
export type DocumentCreateResponse = PostApiDocumentsMutationResponse;
export type ProcessesPickerResponse = GetApiProcessesQueryResponse;
export type ProcessesPickerItem = ProcessesPickerResponse["items"][number];

export function useDocumentsList() {
  return useGetApiDocuments();
}

export function useDocumentDetail(documentId: string) {
  return useQuery<
    DocumentDetailResponse,
    ResponseErrorConfig<{ message?: string }>,
    DocumentDetailResponse
  >({
    enabled: documentId.length > 0,
    queryKey: getApiDocumentsDocumentidQueryKey({ documentId }),
    refetchInterval: (query) => (query.state.data?.status === "generating" ? 1000 : false),
    retry: false,
    queryFn: async () => {
      const response = await client<
        DocumentDetailResponse,
        ResponseErrorConfig<{ message?: string }>,
        unknown
      >({
        method: "GET",
        url: `http://localhost:3333/api/documents/${documentId}`,
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

export function useProcessesPicker() {
  return useGetApiProcesses({ params: { page: 1, pageSize: 100 } });
}

export function useDocumentCreate() {
  const queryClient = useQueryClient();

  return useMutation<
    DocumentCreateResponse,
    ResponseErrorConfig<{ message?: string }>,
    { data: DocumentCreateRequest }
  >({
    mutationFn: async ({ data }) => {
      const response = await client<
        DocumentCreateResponse,
        ResponseErrorConfig<{ message?: string }>,
        DocumentCreateRequest
      >({
        method: "POST",
        url: "http://localhost:3333/api/documents/",
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
      await queryClient.invalidateQueries({ queryKey: getApiDocumentsQueryKey() });
    },
  });
}
