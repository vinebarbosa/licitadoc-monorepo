import { HttpResponse, http } from "msw";
import {
  DEFAULT_SUPPORT_AGENT,
  defaultSupportTicketFilters,
  filterSupportTickets,
  getSupportTicketQueueCounts,
  type SupportTicket,
  type SupportTicketFilters,
} from "@/modules/support/model/support-tickets";
import {
  anonymousSessionResponse,
  currentOrganizationResponse,
  departmentCreateResponse,
  departmentsListResponse,
  documentCreateResponse,
  documentDetailResponse,
  documentsListResponse,
  emptyDocumentDetailResponse,
  failedDocumentDetailResponse,
  generatingDocumentDetailResponse,
  healthOkResponse,
  organizationsListResponse,
  processCreateResponse,
  processDetailResponse,
  processesListResponse,
  requesterSupportTicketsListResponse,
  supportTicketsListResponse,
  usersListResponse,
  widgetSupportTicketResponse,
} from "./fixtures";

const requesterSupportTicketItems: SupportTicket[] = [...requesterSupportTicketsListResponse.items];

function getSupportTicketFiltersFromRequest(request: Request): SupportTicketFilters {
  const url = new URL(request.url);

  return {
    search: url.searchParams.get("search") ?? defaultSupportTicketFilters.search,
    status:
      (url.searchParams.get("status") as SupportTicketFilters["status"] | null) ??
      defaultSupportTicketFilters.status,
    priority:
      (url.searchParams.get("priority") as SupportTicketFilters["priority"] | null) ??
      defaultSupportTicketFilters.priority,
    assignee:
      (url.searchParams.get("assignee") as SupportTicketFilters["assignee"] | null) ??
      defaultSupportTicketFilters.assignee,
    source:
      (url.searchParams.get("source") as SupportTicketFilters["source"] | null) ??
      defaultSupportTicketFilters.source,
  };
}

function createSupportTicketListResponse(tickets: SupportTicket[], filters: SupportTicketFilters) {
  const visibleItems = filterSupportTickets(tickets, filters, DEFAULT_SUPPORT_AGENT);
  const scopedItems = filterSupportTickets(
    tickets,
    { ...filters, status: "all" },
    DEFAULT_SUPPORT_AGENT,
  );

  return {
    items: visibleItems,
    page: 1,
    pageSize: 100,
    total: visibleItems.length,
    totalPages: visibleItems.length > 0 ? 1 : 0,
    counts: getSupportTicketQueueCounts(scopedItems),
  };
}

export const handlers = [
  http.get("http://localhost:3333/health", () => {
    return HttpResponse.json(healthOkResponse);
  }),
  http.get("http://localhost:3333/api/auth/get-session", () => {
    return HttpResponse.json(anonymousSessionResponse);
  }),
  http.post("http://localhost:3333/api/auth/sign-out", () => {
    return HttpResponse.json({ success: true });
  }),
  http.get("http://localhost:3333/api/users/", () => {
    return HttpResponse.json(usersListResponse);
  }),
  http.get("http://localhost:3333/api/invites/", () => {
    return HttpResponse.json({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    });
  }),
  http.get("http://localhost:3333/api/organizations/", () => {
    return HttpResponse.json(organizationsListResponse);
  }),
  http.get("http://localhost:3333/api/organizations/me", () => {
    return HttpResponse.json(currentOrganizationResponse);
  }),
  http.get("http://localhost:3333/api/departments/", () => {
    return HttpResponse.json(departmentsListResponse);
  }),
  http.post("http://localhost:3333/api/departments/", () => {
    return HttpResponse.json(departmentCreateResponse, { status: 201 });
  }),
  http.get("http://localhost:3333/api/processes/", () => {
    return HttpResponse.json(processesListResponse);
  }),
  http.get("http://localhost:3333/api/processes/:processId", ({ params }) => {
    return HttpResponse.json({
      ...processDetailResponse,
      id: String(params.processId ?? processDetailResponse.id),
    });
  }),
  http.post("http://localhost:3333/api/processes/", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { processNumber?: string } | null;

    if (body?.processNumber === "PROC-CONFLICT") {
      return HttpResponse.json(
        {
          error: "conflict",
          message: "Process number already exists.",
          details: null,
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(processCreateResponse, { status: 201 });
  }),
  http.patch("http://localhost:3333/api/processes/:processId", async ({ params, request }) => {
    const body = (await request.json().catch(() => null)) as { processNumber?: string } | null;

    if (body?.processNumber === "PROC-CONFLICT") {
      return HttpResponse.json(
        {
          error: "conflict",
          message: "Process number already exists.",
          details: null,
        },
        { status: 409 },
      );
    }

    return HttpResponse.json({
      ...processDetailResponse,
      ...body,
      id: String(params.processId ?? processDetailResponse.id),
      detailUpdatedAt: "2024-04-01T00:00:00.000Z",
    });
  }),
  http.get("http://localhost:3333/api/documents/", () => {
    return HttpResponse.json(documentsListResponse);
  }),
  http.get("http://localhost:3333/api/documents/:documentId", ({ params }) => {
    const documentId = String(params.documentId ?? "");

    if (documentId === generatingDocumentDetailResponse.id) {
      return HttpResponse.json(generatingDocumentDetailResponse);
    }

    if (documentId === failedDocumentDetailResponse.id) {
      return HttpResponse.json(failedDocumentDetailResponse);
    }

    if (documentId === emptyDocumentDetailResponse.id) {
      return HttpResponse.json(emptyDocumentDetailResponse);
    }

    return HttpResponse.json({
      ...documentDetailResponse,
      id: documentId || documentDetailResponse.id,
    });
  }),
  http.post("http://localhost:3333/api/documents/", () => {
    return HttpResponse.json(documentCreateResponse, { status: 201 });
  }),
  http.get("http://localhost:3333/api/support-tickets/", ({ request }) => {
    return HttpResponse.json(
      createSupportTicketListResponse(
        supportTicketsListResponse.items,
        getSupportTicketFiltersFromRequest(request),
      ),
    );
  }),
  http.post("http://localhost:3333/api/support-tickets/", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      subject?: string;
      content?: string;
      context?: typeof widgetSupportTicketResponse.context;
      attachment?: {
        type: "screenshot";
        name: string;
        description: string;
      };
      attachments?: Array<{
        type: "image";
        name: string;
        description: string;
        storageKey: string;
        mimeType: "image/png" | "image/jpeg" | "image/webp";
        sizeBytes: number;
      }>;
    } | null;

    const createdMessageId = `widget-support-message-${requesterSupportTicketItems.length + 1}`;
    const requestAttachments = [
      ...(body?.attachment ? [body.attachment] : []),
      ...(body?.attachments ?? []),
    ];
    const createdTicket = {
        ...widgetSupportTicketResponse,
        id: `widget-support-ticket-${requesterSupportTicketItems.length + 1}`,
        subject: body?.subject ?? widgetSupportTicketResponse.subject,
        context: body?.context ?? widgetSupportTicketResponse.context,
        attachments: requestAttachments.map((attachment, index) => ({
          ...widgetSupportTicketResponse.attachments[0],
          id: `widget-support-attachment-${requesterSupportTicketItems.length + 1}-${index + 1}`,
          messageId: createdMessageId,
          type: attachment.type,
          name: attachment.name,
          description: attachment.description,
          mimeType: attachment.type === "image" ? attachment.mimeType : undefined,
          sizeBytes: attachment.type === "image" ? attachment.sizeBytes : undefined,
          url:
            attachment.type === "image"
              ? `/api/support-tickets/widget-support-ticket-${requesterSupportTicketItems.length + 1}/attachments/widget-support-attachment-${requesterSupportTicketItems.length + 1}-${index + 1}/image`
              : undefined,
        })),
        messages: [
          {
            ...widgetSupportTicketResponse.messages[0],
            id: createdMessageId,
            content: body?.content ?? widgetSupportTicketResponse.messages[0].content,
          },
        ],
      };
    requesterSupportTicketItems.unshift(createdTicket);

    return HttpResponse.json(createdTicket, { status: 201 });
  }),
  http.post("http://localhost:3333/api/support-tickets/attachments/images", async () => {
    return HttpResponse.json(
      {
        type: "image",
        name: "captura-de-tela.png",
        description: "Imagem anexada pelo usuário.",
        storageKey: `support-ticket-images/user-1/2026/05/${Date.now()}-captura-de-tela.png`,
        mimeType: "image/png",
        sizeBytes: 2048,
      },
      { status: 201 },
    );
  }),
  http.get("http://localhost:3333/api/support-tickets/me", () => {
    return HttpResponse.json({
      ...requesterSupportTicketsListResponse,
      items: requesterSupportTicketItems,
      total: requesterSupportTicketItems.length,
      totalPages: requesterSupportTicketItems.length > 0 ? 1 : 0,
      counts: getSupportTicketQueueCounts(requesterSupportTicketItems),
    });
  }),
  http.get("http://localhost:3333/api/support-tickets/:ticketId", ({ params }) => {
    const ticketId = String(params.ticketId ?? "");
    const ticket =
      requesterSupportTicketItems.find((item) => item.id === ticketId) ??
      supportTicketsListResponse.items.find((item) => item.id === ticketId) ??
      supportTicketsListResponse.items[0];

    return HttpResponse.json(ticket);
  }),
  http.patch("http://localhost:3333/api/support-tickets/:ticketId", async ({ params, request }) => {
    const ticketId = String(params.ticketId ?? "");
    const body = (await request.json().catch(() => null)) as {
      status?: string;
      priority?: string;
      assigneeUserId?: string | null;
    } | null;
    const ticket =
      supportTicketsListResponse.items.find((item) => item.id === ticketId) ??
      supportTicketsListResponse.items[0];
    const assignee =
      body?.assigneeUserId === null
        ? null
        : body?.assigneeUserId
          ? { id: body.assigneeUserId, name: "Maria Silva" }
          : ticket.assignee;

    return HttpResponse.json({
      ...ticket,
      status: body?.status ?? ticket.status,
      priority: body?.priority ?? ticket.priority,
      assignee,
      unreadCount: body?.status === "resolved" ? 0 : ticket.unreadCount,
      updatedAt: "2026-05-16T12:40:00.000Z",
    });
  }),
  http.post(
    "http://localhost:3333/api/support-tickets/:ticketId/messages",
    async ({ params, request }) => {
      const ticketId = String(params.ticketId ?? "");
      const body = (await request.json().catch(() => null)) as {
        content?: string;
        attachments?: Array<{
          type: "image";
          name: string;
          description: string;
          storageKey: string;
          mimeType: "image/png" | "image/jpeg" | "image/webp";
          sizeBytes: number;
        }>;
      } | null;
      const ticket =
        requesterSupportTicketItems.find((item) => item.id === ticketId) ??
        supportTicketsListResponse.items.find((item) => item.id === ticketId) ??
        supportTicketsListResponse.items[0];
      const isRequesterTicket = requesterSupportTicketItems.some((item) => item.id === ticketId);
      const messageId = "33333333-e2e5-4876-b4c3-b35306c6e733";

      return HttpResponse.json(
        {
          ...ticket,
          status: ticket.status === "resolved" ? ticket.status : "waiting",
          assignee: ticket.assignee ?? { id: "user-1", name: "Maria Silva" },
          unreadCount: 0,
          updatedAt: "2026-05-16T12:41:00.000Z",
          attachments: [
            ...ticket.attachments,
            ...(body?.attachments ?? []).map((attachment, index) => ({
              id: `message-attachment-${index + 1}`,
              type: attachment.type,
              name: attachment.name,
              description: attachment.description,
              messageId,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
              url: `/api/support-tickets/${ticketId}/attachments/message-attachment-${index + 1}/image`,
            })),
          ],
          messages: [
            ...ticket.messages,
            {
              id: messageId,
              role: isRequesterTicket ? "user" : "support",
              authorName: isRequesterTicket ? "Maria Silva" : "Admin LicitaDoc",
              content: body?.content ?? "Imagem anexada",
              timestamp: "2026-05-16T12:41:00.000Z",
            },
          ],
        },
        { status: 201 },
      );
    },
  ),
  http.get("http://localhost:3333/api/support-tickets/:ticketId/attachments/:attachmentId/image", () => {
    return new HttpResponse(new Blob(["image"], { type: "image/png" }), {
      headers: { "content-type": "image/png" },
    });
  }),
  http.post("http://localhost:3333/api/support-tickets/:ticketId/read", ({ params }) => {
    const ticketId = String(params.ticketId ?? "");
    const ticket =
      supportTicketsListResponse.items.find((item) => item.id === ticketId) ??
      supportTicketsListResponse.items[0];

    return HttpResponse.json({
      ...ticket,
      unreadCount: 0,
    });
  }),
  http.post("http://localhost:3333/api/support-tickets/:ticketId/typing", () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post("http://localhost:3333/api/support-tickets/realtime/token", () => {
    return HttpResponse.json({
      provider: "disabled",
      realtimeEnabled: false,
      channels: [],
      tokenRequest: null,
    });
  }),
  http.patch("http://localhost:3333/api/documents/:documentId", async ({ params, request }) => {
    const body = (await request.json().catch(() => null)) as {
      draftContent?: string;
      draftContentJson?: unknown;
      sourceContentHash?: string;
    } | null;

    if (body?.sourceContentHash === "sha256:stale") {
      return HttpResponse.json(
        {
          error: "conflict",
          message: "Document content changed before this save completed.",
          details: null,
        },
        { status: 409 },
      );
    }

    return HttpResponse.json({
      ...documentDetailResponse,
      id: String(params.documentId ?? documentDetailResponse.id),
      draftContent: body?.draftContent ?? documentDetailResponse.draftContent,
      draftContentJson: body?.draftContentJson ?? documentDetailResponse.draftContentJson,
      updatedAt: "2024-04-01T00:00:00.000Z",
    });
  }),
];
