import { getApiSupportTicketsMeQueryKey, getApiSupportTicketsQueryKey } from "@licitadoc/api-client";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { getSupportTicketQueueCounts, seededSupportTickets } from "../model/support-tickets";
import {
  type SupportTicketsListResponse,
  type SupportTicketsRequesterListResponse,
  setSupportTicketInCache,
} from "./support-tickets";

describe("support ticket api cache", () => {
  it("upserts realtime ticket events without duplicating the list item", () => {
    const queryClient = new QueryClient();
    const ticket = seededSupportTickets[0];
    const listQueryKey = getApiSupportTicketsQueryKey({ page: 1, pageSize: 100 });
    const nextTicket = {
      ...ticket,
      updatedAt: "2026-05-16T16:41:00.000Z",
      messages: [
        ...ticket.messages,
        {
          id: "33333333-e2e5-4876-b4c3-b35306c6e733",
          role: "support" as const,
          authorName: "Maria Silva",
          content: "Vou revisar a geracao agora.",
          timestamp: "2026-05-16T16:41:00.000Z",
        },
      ],
    };

    queryClient.setQueryData<SupportTicketsListResponse>(listQueryKey, {
      items: [ticket],
      page: 1,
      pageSize: 100,
      total: 1,
      totalPages: 1,
      counts: getSupportTicketQueueCounts([ticket]),
    });

    setSupportTicketInCache(queryClient, nextTicket);
    setSupportTicketInCache(queryClient, nextTicket);

    const list = queryClient.getQueryData<SupportTicketsListResponse>(listQueryKey);

    expect(list?.items).toHaveLength(1);
    expect(list?.items[0]?.messages).toHaveLength(ticket.messages.length + 1);
    expect(list?.items[0]?.messages.at(-1)?.content).toBe("Vou revisar a geracao agora.");
  });

  it("adds widget-created tickets to admin and requester support caches", () => {
    const queryClient = new QueryClient();
    const ticket = seededSupportTickets[0];
    const adminListQueryKey = getApiSupportTicketsQueryKey({ page: 1, pageSize: 100 });
    const requesterListQueryKey = getApiSupportTicketsMeQueryKey({ page: 1, pageSize: 50 });
    const widgetTicket = {
      ...ticket,
      id: "widget-created-ticket",
      protocol: "LD-SUP-2001",
      subject: "Chamado criado pelo widget",
      updatedAt: "2026-05-16T16:50:00.000Z",
    };

    queryClient.setQueryData<SupportTicketsListResponse>(adminListQueryKey, {
      items: [ticket],
      page: 1,
      pageSize: 100,
      total: 1,
      totalPages: 1,
      counts: getSupportTicketQueueCounts([ticket]),
    });
    queryClient.setQueryData<SupportTicketsRequesterListResponse>(requesterListQueryKey, {
      items: [],
      page: 1,
      pageSize: 50,
      total: 0,
      totalPages: 0,
      counts: getSupportTicketQueueCounts([]),
    });

    setSupportTicketInCache(queryClient, widgetTicket);

    const adminList = queryClient.getQueryData<SupportTicketsListResponse>(adminListQueryKey);
    const requesterList =
      queryClient.getQueryData<SupportTicketsRequesterListResponse>(requesterListQueryKey);

    expect(adminList?.items[0]?.subject).toBe("Chamado criado pelo widget");
    expect(requesterList?.items[0]?.subject).toBe("Chamado criado pelo widget");
  });
});
