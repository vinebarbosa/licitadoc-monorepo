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
  invitesListResponse,
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

type MockOrganization = Omit<
  typeof currentOrganizationResponse,
  "crestUrl" | "letterhead" | "letterheadTemplateUrl" | "logoUrl"
> & {
  crestUrl: string | null;
  letterhead: { url: string } | null;
  letterheadTemplateUrl: string | null;
  logoUrl: string | null;
};

let currentOrganization: MockOrganization = { ...currentOrganizationResponse };
let organizationUsers = [...usersListResponse.items];
let organizationInvites = [...invitesListResponse.items];
let organizationDepartments = [...departmentsListResponse.items];

export function resetOrganizationWorkspaceMockData() {
  currentOrganization = { ...currentOrganizationResponse };
  organizationUsers = [...usersListResponse.items];
  organizationInvites = [...invitesListResponse.items];
  organizationDepartments = [...departmentsListResponse.items];
}

function createListResponse<TItem>(
  base: { page: number; pageSize: number; totalPages: number },
  items: TItem[],
) {
  return {
    ...base,
    items,
    total: items.length,
    totalPages: items.length > 0 ? 1 : 0,
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
  http.get("http://localhost:3333/api/users/", ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase().trim();
    const role = url.searchParams.get("role");
    const items = organizationUsers.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      const matchesRole = !role || user.role === role;

      return matchesSearch && matchesRole;
    });

    return HttpResponse.json(createListResponse(usersListResponse, items));
  }),
  http.get("http://localhost:3333/api/invites/", () => {
    return HttpResponse.json(createListResponse(invitesListResponse, organizationInvites));
  }),
  http.post("http://localhost:3333/api/invites/", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      email?: string;
      organizationId?: string | null;
    } | null;
    const created = {
      ...invitesListResponse.items[0],
      id: `invite-${organizationInvites.length + 1}`,
      email: body?.email ?? "novo.membro@prefeitura.gov.br",
      organizationId: body?.organizationId ?? currentOrganization.id,
      createdAt: "2026-05-22T10:00:00.000Z",
      updatedAt: "2026-05-22T10:00:00.000Z",
      expiresAt: "2026-05-29T10:00:00.000Z",
      token: "invite-token",
      inviteUrl: "http://localhost:5173/convite/invite-token",
    };

    organizationInvites = [created, ...organizationInvites];

    return HttpResponse.json(created, { status: 201 });
  }),
  http.post("http://localhost:3333/api/invites/:inviteId/resend", ({ params }) => {
    const inviteId = String(params.inviteId ?? "");
    const invite = organizationInvites.find((item) => item.id === inviteId);
    const updatedInvite = {
      ...(invite ?? invitesListResponse.items[0]),
      id: inviteId || invitesListResponse.items[0].id,
      status: "pending",
      updatedAt: "2026-05-22T10:05:00.000Z",
      expiresAt: "2026-05-29T10:05:00.000Z",
      token: "resent-invite-token",
      inviteUrl: "http://localhost:5173/convite/resent-invite-token",
    };

    organizationInvites = organizationInvites.map((item) =>
      item.id === updatedInvite.id ? updatedInvite : item,
    );

    return HttpResponse.json(updatedInvite);
  }),
  http.patch("http://localhost:3333/api/invites/:inviteId/revoke", ({ params }) => {
    const inviteId = String(params.inviteId ?? "");
    const invite = organizationInvites.find((item) => item.id === inviteId);
    const updatedInvite = {
      ...(invite ?? invitesListResponse.items[0]),
      id: inviteId || invitesListResponse.items[0].id,
      status: "revoked",
      updatedAt: "2026-05-22T10:10:00.000Z",
    };

    organizationInvites = organizationInvites.map((item) =>
      item.id === updatedInvite.id ? updatedInvite : item,
    );

    return HttpResponse.json(updatedInvite);
  }),
  http.get("http://localhost:3333/api/organizations/", () => {
    return HttpResponse.json({ ...organizationsListResponse, items: [currentOrganization] });
  }),
  http.get("http://localhost:3333/api/organizations/me", () => {
    return HttpResponse.json(currentOrganization);
  }),
  http.patch("http://localhost:3333/api/organizations/:organizationId", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Partial<
      typeof currentOrganizationResponse
    > | null;

    currentOrganization = {
      ...currentOrganization,
      ...body,
      updatedAt: "2026-05-21T00:00:00.000Z",
    };

    return HttpResponse.json(currentOrganization);
  }),
  http.post("http://localhost:3333/api/organizations/:organizationId/letterhead", ({ params }) => {
    currentOrganization = {
      ...currentOrganization,
      letterhead: { url: `/api/organizations/${String(params.organizationId)}/letterhead/image` },
      updatedAt: "2026-05-21T00:00:00.000Z",
    };

    return HttpResponse.json(currentOrganization, { status: 201 });
  }),
  http.post("http://localhost:3333/api/organizations/:organizationId/logo", ({ params }) => {
    currentOrganization = {
      ...currentOrganization,
      logoUrl: `/api/organizations/${String(params.organizationId)}/logo/file`,
      updatedAt: "2026-05-22T10:20:00.000Z",
    };

    return HttpResponse.json(currentOrganization, { status: 201 });
  }),
  http.post("http://localhost:3333/api/organizations/:organizationId/crest", ({ params }) => {
    currentOrganization = {
      ...currentOrganization,
      crestUrl: `/api/organizations/${String(params.organizationId)}/crest/file`,
      updatedAt: "2026-05-22T10:25:00.000Z",
    };

    return HttpResponse.json(currentOrganization, { status: 201 });
  }),
  http.post(
    "http://localhost:3333/api/organizations/:organizationId/letterhead-template",
    ({ params }) => {
      currentOrganization = {
        ...currentOrganization,
        letterheadTemplateUrl: `/api/organizations/${String(params.organizationId)}/letterhead-template/file`,
        updatedAt: "2026-05-22T10:30:00.000Z",
      };

      return HttpResponse.json(currentOrganization, { status: 201 });
    },
  ),
  http.get("http://localhost:3333/api/organizations/:organizationId/logo/file", () => {
    return new HttpResponse(new Blob(["logo"], { type: "image/png" }), {
      headers: { "content-type": "image/png" },
    });
  }),
  http.get("http://localhost:3333/api/organizations/:organizationId/crest/file", () => {
    return new HttpResponse(new Blob(["crest"], { type: "image/png" }), {
      headers: { "content-type": "image/png" },
    });
  }),
  http.get("http://localhost:3333/api/organizations/:organizationId/letterhead/image", () => {
    return new HttpResponse(new Blob(["letterhead"], { type: "image/jpeg" }), {
      headers: { "content-type": "image/jpeg" },
    });
  }),
  http.get(
    "http://localhost:3333/api/organizations/:organizationId/letterhead-template/file",
    () => {
      return new HttpResponse(new Blob(["letterhead"], { type: "application/pdf" }), {
        headers: { "content-type": "application/pdf" },
      });
    },
  ),
  http.get("http://localhost:3333/api/departments/", () => {
    return HttpResponse.json(createListResponse(departmentsListResponse, organizationDepartments));
  }),
  http.post("http://localhost:3333/api/departments/", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Partial<
      typeof departmentCreateResponse
    > | null;
    const created = {
      ...departmentCreateResponse,
      ...body,
      id: `department-${organizationDepartments.length + 1}`,
      organizationId: body?.organizationId ?? currentOrganization.id,
      createdAt: "2026-05-22T11:00:00.000Z",
      updatedAt: "2026-05-22T11:00:00.000Z",
    };

    organizationDepartments = [...organizationDepartments, created];

    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch("http://localhost:3333/api/departments/:departmentId", async ({ params, request }) => {
    const body = (await request.json().catch(() => null)) as Partial<
      typeof departmentCreateResponse
    > | null;
    const departmentId = String(params.departmentId ?? departmentsListResponse.items[0].id);
    const currentDepartment =
      organizationDepartments.find((item) => item.id === departmentId) ??
      departmentsListResponse.items[0];
    const updatedDepartment = {
      ...currentDepartment,
      ...body,
      id: departmentId,
      updatedAt: "2026-05-21T00:00:00.000Z",
    };

    organizationDepartments = organizationDepartments.map((item) =>
      item.id === departmentId ? updatedDepartment : item,
    );

    return HttpResponse.json(updatedDepartment);
  }),
  http.delete("http://localhost:3333/api/departments/:departmentId", ({ params }) => {
    const departmentId = String(params.departmentId ?? "");

    organizationDepartments = organizationDepartments.filter((item) => item.id !== departmentId);

    return HttpResponse.json({ success: true });
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
  http.get(
    "http://localhost:3333/api/support-tickets/:ticketId/attachments/:attachmentId/image",
    () => {
      return new HttpResponse(new Blob(["image"], { type: "image/png" }), {
        headers: { "content-type": "image/png" },
      });
    },
  ),
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
