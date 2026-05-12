import {
  client,
  type GetApiDocumentsDocumentidQueryResponse,
  type GetApiDocumentsQueryResponse,
  type GetApiProcessesQueryResponse,
  getApiDocumentsDocumentidQueryKey,
  getApiDocumentsQueryKey,
  type PostApiDocumentsDocumentidAdjustmentsApplyMutationRequest,
  type PostApiDocumentsDocumentidAdjustmentsApplyMutationResponse,
  type PostApiDocumentsDocumentidAdjustmentsSuggestionsMutationRequest,
  type PostApiDocumentsDocumentidAdjustmentsSuggestionsMutationResponse,
  type PostApiDocumentsMutationRequest,
  type PostApiDocumentsMutationResponse,
  type ResponseErrorConfig,
  useGetApiDocuments,
  useGetApiProcesses,
} from "@licitadoc/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

export type DocumentsListResponse = GetApiDocumentsQueryResponse;
export type DocumentsListItem = DocumentsListResponse["items"][number];
export type DocumentDetailResponse = GetApiDocumentsDocumentidQueryResponse;
export type DocumentCreateRequest = PostApiDocumentsMutationRequest;
export type DocumentCreateResponse = PostApiDocumentsMutationResponse;
export type DocumentTextAdjustmentSuggestionRequest =
  PostApiDocumentsDocumentidAdjustmentsSuggestionsMutationRequest;
export type DocumentTextAdjustmentSuggestionResponse =
  PostApiDocumentsDocumentidAdjustmentsSuggestionsMutationResponse;
export type DocumentTextAdjustmentApplyRequest =
  PostApiDocumentsDocumentidAdjustmentsApplyMutationRequest;
export type DocumentTextAdjustmentApplyResponse =
  PostApiDocumentsDocumentidAdjustmentsApplyMutationResponse;
export type ProcessesPickerResponse = GetApiProcessesQueryResponse;
export type ProcessesPickerItem = ProcessesPickerResponse["items"][number];

export type DocumentGenerationStreamEvent =
  | {
      type: "planning";
      documentId: string;
      planningDelta: string;
      planningContent: string;
      status: "generating";
    }
  | {
      type: "snapshot";
      documentId: string;
      content: string;
      status: "generating";
    }
  | {
      type: "chunk";
      documentId: string;
      textDelta: string;
      content: string;
      status: "generating";
    }
  | {
      type: "completed";
      documentId: string;
      content: string;
      status: "completed";
    }
  | {
      type: "failed";
      documentId: string;
      errorCode: string;
      errorMessage: string;
      status: "failed";
    };

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

function parseDocumentGenerationEvent(event: MessageEvent) {
  try {
    return JSON.parse(event.data) as DocumentGenerationStreamEvent;
  } catch {
    return null;
  }
}

const LIVE_PREVIEW_DRAIN_INTERVAL_MS = 24;
const LIVE_PREVIEW_DRAIN_CHARS_PER_TICK = 12;

export function useDocumentGenerationEvents({
  documentId,
  enabled,
  onCompleted,
  onFailed,
}: {
  documentId: string;
  enabled: boolean;
  onCompleted?: () => void;
  onFailed?: () => void;
}) {
  const [content, setContent] = useState("");
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [planningContent, setPlanningContent] = useState("");
  const pendingTextRef = useRef("");
  const receivedPlanningContentRef = useRef("");
  const receivedContentRef = useRef("");
  const visibleContentRef = useRef("");
  const drainTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopDrainLoop = useCallback(() => {
    if (!drainTimerRef.current) {
      return;
    }

    clearInterval(drainTimerRef.current);
    drainTimerRef.current = null;
  }, []);

  const appendVisibleContent = useCallback((nextText: string) => {
    visibleContentRef.current = `${visibleContentRef.current}${nextText}`;
    setContent(visibleContentRef.current);
  }, []);

  const startDrainLoop = useCallback(() => {
    if (drainTimerRef.current || pendingTextRef.current.length === 0) {
      return;
    }

    drainTimerRef.current = setInterval(() => {
      if (pendingTextRef.current.length === 0) {
        stopDrainLoop();
        return;
      }

      const nextText = pendingTextRef.current.slice(0, LIVE_PREVIEW_DRAIN_CHARS_PER_TICK);
      pendingTextRef.current = pendingTextRef.current.slice(LIVE_PREVIEW_DRAIN_CHARS_PER_TICK);
      appendVisibleContent(nextText);
    }, LIVE_PREVIEW_DRAIN_INTERVAL_MS);
  }, [appendVisibleContent, stopDrainLoop]);

  const resetLivePreview = useCallback(() => {
    stopDrainLoop();
    pendingTextRef.current = "";
    receivedPlanningContentRef.current = "";
    receivedContentRef.current = "";
    visibleContentRef.current = "";
    setContent("");
    setPlanningContent("");
  }, [stopDrainLoop]);

  const enqueueTextDelta = useCallback(
    (textDelta: string) => {
      if (!textDelta) {
        return;
      }

      receivedContentRef.current = `${receivedContentRef.current}${textDelta}`;
      pendingTextRef.current = `${pendingTextRef.current}${textDelta}`;
      startDrainLoop();
    },
    [startDrainLoop],
  );

  const reconcileReceivedContent = useCallback(
    (nextContent: string) => {
      if (!nextContent) {
        return;
      }

      if (nextContent === receivedContentRef.current) {
        return;
      }

      if (nextContent.startsWith(receivedContentRef.current)) {
        const missingText = nextContent.slice(receivedContentRef.current.length);
        receivedContentRef.current = nextContent;
        pendingTextRef.current = `${pendingTextRef.current}${missingText}`;
        startDrainLoop();
        return;
      }

      receivedContentRef.current = nextContent;

      if (nextContent.startsWith(visibleContentRef.current)) {
        pendingTextRef.current = nextContent.slice(visibleContentRef.current.length);
        startDrainLoop();
        return;
      }

      visibleContentRef.current = "";
      pendingTextRef.current = nextContent;
      setContent("");
      startDrainLoop();
    },
    [startDrainLoop],
  );

  const flushVisibleContent = useCallback(
    (nextContent: string) => {
      stopDrainLoop();
      pendingTextRef.current = "";
      receivedContentRef.current = nextContent;
      visibleContentRef.current = nextContent;
      setContent(nextContent);
    },
    [stopDrainLoop],
  );

  const reconcilePlanningContent = useCallback((nextPlanningContent: string) => {
    receivedPlanningContentRef.current = nextPlanningContent;
    setPlanningContent(nextPlanningContent);
  }, []);

  useEffect(() => {
    resetLivePreview();
    setIsUnavailable(false);

    if (!enabled || !documentId) {
      return;
    }

    if (typeof EventSource === "undefined") {
      setIsUnavailable(true);
      return;
    }

    const source = new EventSource(`http://localhost:3333/api/documents/${documentId}/events`, {
      withCredentials: true,
    });

    const handleProgress = (event: MessageEvent) => {
      const payload = parseDocumentGenerationEvent(event);

      if (!payload || payload.documentId !== documentId) {
        return;
      }

      if (payload.type === "chunk") {
        enqueueTextDelta(payload.textDelta);
        return;
      }

      if (payload.type === "planning") {
        reconcilePlanningContent(payload.planningContent);
        return;
      }

      if (payload.type === "snapshot") {
        reconcileReceivedContent(payload.content);
      }
    };
    const handleCompleted = (event: MessageEvent) => {
      const payload = parseDocumentGenerationEvent(event);

      if (payload?.type === "completed" && payload.documentId === documentId) {
        flushVisibleContent(payload.content);
      }

      source.close();
      onCompleted?.();
    };
    const handleFailed = () => {
      stopDrainLoop();
      source.close();
      onFailed?.();
    };

    source.addEventListener("snapshot", handleProgress);
    source.addEventListener("chunk", handleProgress);
    source.addEventListener("planning", handleProgress);
    source.addEventListener("completed", handleCompleted);
    source.addEventListener("failed", handleFailed);
    source.onerror = () => {
      stopDrainLoop();
      setIsUnavailable(true);
      source.close();
    };

    return () => {
      stopDrainLoop();
      source.close();
    };
  }, [
    documentId,
    enabled,
    enqueueTextDelta,
    flushVisibleContent,
    onCompleted,
    onFailed,
    reconcilePlanningContent,
    reconcileReceivedContent,
    resetLivePreview,
    stopDrainLoop,
  ]);

  return {
    content,
    isUnavailable,
    planningContent,
  };
}

export function useProcessesPicker() {
  return useGetApiProcesses({ params: { page: 1, pageSize: 100 } });
}

export function getDocumentMutationErrorMessage(error: unknown, fallbackMessage: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: unknown } }).data;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallbackMessage;
}

export function useDocumentTextAdjustmentSuggestion() {
  return useMutation<
    DocumentTextAdjustmentSuggestionResponse,
    ResponseErrorConfig<{ message?: string }>,
    { documentId: string; data: DocumentTextAdjustmentSuggestionRequest }
  >({
    mutationFn: async ({ documentId, data }) => {
      const response = await client<
        DocumentTextAdjustmentSuggestionResponse,
        ResponseErrorConfig<{ message?: string }>,
        DocumentTextAdjustmentSuggestionRequest
      >({
        method: "POST",
        url: `http://localhost:3333/api/documents/${documentId}/adjustments/suggestions`,
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
  });
}

export function useDocumentTextAdjustmentApply(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    DocumentTextAdjustmentApplyResponse,
    ResponseErrorConfig<{ message?: string }>,
    { documentId: string; data: DocumentTextAdjustmentApplyRequest }
  >({
    mutationFn: async ({ documentId: docId, data }) => {
      const response = await client<
        DocumentTextAdjustmentApplyResponse,
        ResponseErrorConfig<{ message?: string }>,
        DocumentTextAdjustmentApplyRequest
      >({
        method: "POST",
        url: `http://localhost:3333/api/documents/${docId}/adjustments/apply`,
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
    onSuccess: async (updatedDocument) => {
      queryClient.setQueryData(getApiDocumentsDocumentidQueryKey({ documentId }), updatedDocument);
      await queryClient.invalidateQueries({ queryKey: getApiDocumentsQueryKey() });
    },
  });
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
