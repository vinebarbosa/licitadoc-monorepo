import {
  type GetApiSupportTicketsQueryParams,
  type GetApiSupportTicketsQueryResponse,
  type GetApiSupportTicketsMeQueryResponse,
  type GetApiSupportTicketsTicketidQueryResponse,
  getApiSupportTicketsMeQueryKey,
  getApiSupportTicketsQueryKey,
  getApiSupportTicketsTicketidQueryKey,
  type PatchApiSupportTicketsTicketidMutationRequest,
  type PatchApiSupportTicketsTicketidMutationResponse,
  type PostApiSupportTicketsMutationRequest,
  type PostApiSupportTicketsMutationResponse,
  type PostApiSupportTicketsRealtimeTokenMutationRequest,
  type PostApiSupportTicketsRealtimeTokenMutationResponse,
  type PostApiSupportTicketsTicketidMessagesMutationRequest,
  type PostApiSupportTicketsTicketidMessagesMutationResponse,
  type PostApiSupportTicketsTicketidReadMutationResponse,
  type PostApiSupportTicketsTicketidTypingMutationRequest,
  type ResponseErrorConfig,
  useGetApiSupportTickets,
  useGetApiSupportTicketsMe,
  useGetApiSupportTicketsTicketid,
  usePatchApiSupportTicketsTicketid,
  usePostApiSupportTickets,
  usePostApiSupportTicketsRealtimeToken,
  usePostApiSupportTicketsTicketidMessages,
  usePostApiSupportTicketsTicketidRead,
  usePostApiSupportTicketsTicketidTyping,
  client,
} from "@licitadoc/api-client";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PendingSupportTicketImageAttachment,
  SupportTicket,
  SupportTicketFilters,
} from "../model/support-tickets";

export type SupportTicketsListResponse = GetApiSupportTicketsQueryResponse;
export type SupportTicketsRequesterListResponse = GetApiSupportTicketsMeQueryResponse;
export type SupportTicketResponse = GetApiSupportTicketsTicketidQueryResponse;
export type SupportTicketCreateRequest = PostApiSupportTicketsMutationRequest;
export type SupportTicketCreateResponse = PostApiSupportTicketsMutationResponse;
export type SupportTicketUpdateRequest = PatchApiSupportTicketsTicketidMutationRequest;
export type SupportTicketUpdateResponse = PatchApiSupportTicketsTicketidMutationResponse;
export type SupportTicketMessageCreateRequest =
  PostApiSupportTicketsTicketidMessagesMutationRequest;
export type SupportTicketMessageCreateResponse =
  PostApiSupportTicketsTicketidMessagesMutationResponse;
export type SupportTicketReadResponse = PostApiSupportTicketsTicketidReadMutationResponse;
export type SupportTicketTypingRequest = PostApiSupportTicketsTicketidTypingMutationRequest;
export type SupportRealtimeTokenRequest = PostApiSupportTicketsRealtimeTokenMutationRequest;
export type SupportRealtimeTokenResponse = PostApiSupportTicketsRealtimeTokenMutationResponse;

export type SupportImageUploadResponse = PendingSupportTicketImageAttachment;

function createSingleTicketCounts(ticket: SupportTicket): SupportTicketsListResponse["counts"] {
  return {
    all: 1,
    open: ticket.status === "open" ? 1 : 0,
    waiting: ticket.status === "waiting" ? 1 : 0,
    resolved: ticket.status === "resolved" ? 1 : 0,
    attention: 0,
  };
}

export type SupportTicketRealtimeEvent =
  | {
      type: "ticket.message.created";
      ticketId: string;
      organizationId: string;
      message: SupportTicket["messages"][number];
      ticket: SupportTicket;
      occurredAt: string;
    }
  | {
      type: "ticket.updated";
      ticketId: string;
      organizationId: string;
      ticket: SupportTicket;
      occurredAt: string;
    }
  | {
      type: "ticket.read";
      ticketId: string;
      organizationId: string;
      actorId: string;
      unreadCount: number;
      occurredAt: string;
    }
  | {
      type: "ticket.typing";
      ticketId: string;
      organizationId: string;
      actor: {
        id: string;
        name: string;
      };
      isTyping: boolean;
      occurredAt: string;
    };

function toSupportTicketsQueryParams(
  filters: SupportTicketFilters,
): GetApiSupportTicketsQueryParams {
  return {
    page: 1,
    pageSize: 100,
    search: filters.search.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    priority: filters.priority === "all" ? undefined : filters.priority,
    source: filters.source === "all" ? undefined : filters.source,
    assignee: filters.assignee === "all" ? undefined : filters.assignee,
  };
}

function upsertTicketInList(data: SupportTicketsListResponse | undefined, ticket: SupportTicket) {
  if (!data) {
    return {
      items: [ticket],
      page: 1,
      pageSize: 100,
      total: 1,
      totalPages: 1,
      counts: createSingleTicketCounts(ticket),
    };
  }

  const existingIndex = data.items.findIndex((item) => item.id === ticket.id);
  const nextItems =
    existingIndex >= 0
      ? data.items.map((item) => (item.id === ticket.id ? ticket : item))
      : [ticket, ...data.items];

  return {
    ...data,
    items: nextItems.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  };
}

function dedupeSupportTicketMessages(ticket: SupportTicket): SupportTicket {
  const messagesById = new Map(ticket.messages.map((message) => [message.id, message]));

  return {
    ...ticket,
    messages: Array.from(messagesById.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    ),
  };
}

export function setSupportTicketInCache(queryClient: QueryClient, ticket: SupportTicket) {
  const dedupedTicket = dedupeSupportTicketMessages(ticket);

  queryClient.setQueriesData<SupportTicketsListResponse>(
    {
      predicate: (query) => {
        const [key] = query.queryKey;
        return (
          typeof key === "object" &&
          key !== null &&
          "url" in key &&
          key.url === "/api/support-tickets/"
        );
      },
    },
    (data) => upsertTicketInList(data, dedupedTicket),
  );
  queryClient.setQueriesData<SupportTicketsRequesterListResponse>(
    {
      predicate: (query) => {
        const [key] = query.queryKey;
        return (
          typeof key === "object" &&
          key !== null &&
          "url" in key &&
          key.url === "/api/support-tickets/me"
        );
      },
    },
    (data) => upsertTicketInList(data, dedupedTicket),
  );
  queryClient.setQueryData(
    getApiSupportTicketsTicketidQueryKey({ ticketId: dedupedTicket.id }),
    dedupedTicket,
  );
  queryClient.invalidateQueries({ queryKey: getApiSupportTicketsQueryKey() });
  queryClient.invalidateQueries({ queryKey: getApiSupportTicketsMeQueryKey() });
}

export function useSupportTicketsList(filters: SupportTicketFilters) {
  const params = useMemo(() => toSupportTicketsQueryParams(filters), [filters]);

  return useGetApiSupportTickets(
    { params },
    {
      query: {
        retry: false,
      },
    },
  );
}

export function useRequesterSupportTicketsList({ enabled = true }: { enabled?: boolean } = {}) {
  return useGetApiSupportTicketsMe(
    { params: { page: 1, pageSize: 50 } },
    {
      query: {
        enabled,
        retry: false,
      },
    },
  );
}

export function useSupportTicketDetail(ticketId: string | null) {
  return useGetApiSupportTicketsTicketid(
    { ticketId: ticketId ?? "" },
    {
      query: {
        enabled: !!ticketId,
        retry: false,
      },
    },
  );
}

export function useSupportTicketCreate() {
  const queryClient = useQueryClient();

  return usePostApiSupportTickets({
    mutation: {
      onSuccess: (ticket) => {
        setSupportTicketInCache(queryClient, ticket);
      },
    },
  });
}

export function useSupportTicketUpdate() {
  const queryClient = useQueryClient();

  return usePatchApiSupportTicketsTicketid({
    mutation: {
      onSuccess: (ticket) => {
        setSupportTicketInCache(queryClient, ticket);
      },
    },
  });
}

export function useSupportTicketMessageCreate() {
  const queryClient = useQueryClient();

  return usePostApiSupportTicketsTicketidMessages({
    mutation: {
      onSuccess: (ticket) => {
        setSupportTicketInCache(queryClient, ticket);
      },
    },
  });
}

export function useSupportTicketRead() {
  const queryClient = useQueryClient();

  return usePostApiSupportTicketsTicketidRead({
    mutation: {
      onSuccess: (ticket) => {
        setSupportTicketInCache(queryClient, ticket);
      },
    },
  });
}

export function useSupportTicketTyping() {
  return usePostApiSupportTicketsTicketidTyping();
}

export async function uploadSupportTicketImage(file: File) {
  const data = new FormData();
  data.set("file", file);

  const response = await client<SupportImageUploadResponse>({
    url: "/api/support-tickets/attachments/images",
    method: "POST",
    data,
  });

  if (response.status >= 400) {
    throw response.data;
  }

  return response.data;
}

export function useSupportRealtimeToken() {
  return usePostApiSupportTicketsRealtimeToken();
}

function isSupportTicketRealtimeEvent(value: unknown): value is SupportTicketRealtimeEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

type AblyMessage = {
  data: unknown;
};

type AblyChannel = {
  subscribe: (handler: (message: AblyMessage) => void) => Promise<void> | void;
  unsubscribe: (handler?: (message: AblyMessage) => void) => void;
};

type AblyRealtimeClient = {
  channels: {
    get: (channelName: string) => AblyChannel;
  };
  connection?: {
    on?: (eventName: string, handler: () => void) => void;
    off?: (eventName: string, handler: () => void) => void;
  };
  close: () => void;
};

export function useSupportTicketRealtime({
  ticket,
  enabled,
  includeQueue = true,
  onTyping,
}: {
  ticket: SupportTicket | null;
  enabled: boolean;
  includeQueue?: boolean;
  onTyping: (event: Extract<SupportTicketRealtimeEvent, { type: "ticket.typing" }>) => void;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync: createRealtimeToken } = useSupportRealtimeToken();
  const [isConnected, setIsConnected] = useState(false);
  const reconnectRef = useRef(false);

  useEffect(() => {
    let client: AblyRealtimeClient | null = null;
    let channelHandlers: Array<{ channel: AblyChannel; handler: (message: AblyMessage) => void }> =
      [];
    let cancelled = false;

    async function connect() {
      if (!enabled || !ticket) {
        return;
      }

      const token = await createRealtimeToken({
        data: {
          ticketId: ticket.id,
          organizationId: includeQueue ? ticket.organizationId : undefined,
        },
      });

      if (cancelled || !token.realtimeEnabled || !token.tokenRequest) {
        return;
      }

      const ably = await import("ably");
      const Realtime = ably.Realtime as unknown as {
        new (options: {
          authCallback: (
            tokenParams: unknown,
            callback: (error: string | null, tokenRequest: Record<string, unknown> | null) => void,
          ) => void;
        }): AblyRealtimeClient;
      };

      client = new Realtime({
        authCallback: (_tokenParams, callback) => callback(null, token.tokenRequest),
      });

      const handleEvent = (message: AblyMessage) => {
        if (!isSupportTicketRealtimeEvent(message.data)) {
          return;
        }

        if (message.data.type === "ticket.typing") {
          onTyping(message.data);
          return;
        }

        if ("ticket" in message.data) {
          setSupportTicketInCache(queryClient, message.data.ticket);
        }
      };

      channelHandlers = token.channels.map((channelName) => {
        const channel = client?.channels.get(channelName);

        if (!channel) {
          throw new Error("Realtime channel unavailable.");
        }

        channel.subscribe(handleEvent);
        return { channel, handler: handleEvent };
      });

      const handleConnected = () => {
        setIsConnected(true);

        if (reconnectRef.current) {
          queryClient.invalidateQueries({ queryKey: getApiSupportTicketsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getApiSupportTicketsMeQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getApiSupportTicketsTicketidQueryKey({ ticketId: ticket.id }),
          });
        }

        reconnectRef.current = true;
      };

      client.connection?.on?.("connected", handleConnected);
      client.connection?.on?.("update", handleConnected);
    }

    connect().catch(() => {
      setIsConnected(false);
    });

    return () => {
      cancelled = true;
      setIsConnected(false);
      channelHandlers.forEach(({ channel, handler }) => {
        channel.unsubscribe(handler);
      });
      client?.close();
    };
  }, [createRealtimeToken, enabled, includeQueue, onTyping, queryClient, ticket]);

  return { isConnected };
}

export type SupportTicketApiError = ResponseErrorConfig<{ message?: string }>;
