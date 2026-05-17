import { eq, inArray, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import {
  supportTicketAttachments,
  supportTicketMessages,
  type supportTicketReads,
  supportTickets,
  users,
} from "../../db";

export type SupportTicketStatus = "open" | "waiting" | "resolved";
export type SupportTicketPriority = "urgent" | "high" | "medium" | "low";
export type SupportTicketSource = "process" | "document" | "workspace";
export type SupportTicketMessageRole = "user" | "support" | "system";

export type StoredSupportTicket = typeof supportTickets.$inferSelect;
export type StoredSupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type StoredSupportTicketAttachment = typeof supportTicketAttachments.$inferSelect;
export type StoredSupportTicketRead = typeof supportTicketReads.$inferSelect;
export type StoredSupportAssignee = Pick<typeof users.$inferSelect, "id" | "name">;

export const SUPPORT_TICKET_MESSAGE_CREATED_EVENT = "ticket.message.created";
export const SUPPORT_TICKET_UPDATED_EVENT = "ticket.updated";
export const SUPPORT_TICKET_TYPING_EVENT = "ticket.typing";
export const SUPPORT_TICKET_READ_EVENT = "ticket.read";

export function getSupportTicketChannel(ticketId: string) {
  return `private:ticket:${ticketId}`;
}

export function getSupportTicketQueueChannel(organizationId: string) {
  return `private:org:${organizationId}:support-tickets`;
}

export function getSupportTicketsVisibilityScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  return eq(supportTickets.requesterUserId, actor.id);
}

export function resolveSupportMessageRole(actor: Actor): SupportTicketMessageRole {
  return actor.role === "admin" ? "support" : "user";
}

export function isSupportTicketStatus(value: string): value is SupportTicketStatus {
  return value === "open" || value === "waiting" || value === "resolved";
}

export function isSupportTicketPriority(value: string): value is SupportTicketPriority {
  return value === "urgent" || value === "high" || value === "medium" || value === "low";
}

export function isSupportTicketSource(value: string): value is SupportTicketSource {
  return value === "process" || value === "document" || value === "workspace";
}

export function isSupportTicketMessageRole(value: string): value is SupportTicketMessageRole {
  return value === "user" || value === "support" || value === "system";
}

function isSupportAttachmentType(value: string): value is "screenshot" | "image" {
  return value === "screenshot" || value === "image";
}

function isSupportImageMimeType(value: string | null): value is "image/png" | "image/jpeg" | "image/webp" {
  return value === "image/png" || value === "image/jpeg" || value === "image/webp";
}

function serializeSupportMessage(message: StoredSupportTicketMessage) {
  return {
    id: message.id,
    role: isSupportTicketMessageRole(message.role) ? message.role : ("system" as const),
    authorName: message.authorName,
    content: message.content,
    timestamp: message.createdAt.toISOString(),
  };
}

function serializeSupportAttachment(attachment: StoredSupportTicketAttachment) {
  const type = isSupportAttachmentType(attachment.type) ? attachment.type : ("screenshot" as const);
  const serialized = {
    id: attachment.id,
    type,
    name: attachment.name,
    description: attachment.description,
    messageId: attachment.messageId ?? undefined,
  };

  if (type !== "image") {
    return serialized;
  }

  return {
    ...serialized,
    mimeType: isSupportImageMimeType(attachment.mimeType) ? attachment.mimeType : undefined,
    sizeBytes: attachment.sizeBytes ?? undefined,
    url: `/api/support-tickets/${attachment.ticketId}/attachments/${attachment.id}/image`,
  };
}

export function getSupportTicketUnreadCount({
  actor,
  messages,
  read,
}: {
  actor: Actor;
  messages: StoredSupportTicketMessage[];
  read?: StoredSupportTicketRead;
}) {
  const readAt = read?.readAt.getTime() ?? 0;

  return messages.filter((message) => {
    if (message.role === "system") {
      return false;
    }

    if (message.authorUserId === actor.id) {
      return false;
    }

    return message.createdAt.getTime() > readAt;
  }).length;
}

export function serializeSupportTicket({
  ticket,
  messages,
  attachments,
  assignee,
  unreadCount,
}: {
  ticket: StoredSupportTicket;
  messages: StoredSupportTicketMessage[];
  attachments: StoredSupportTicketAttachment[];
  assignee?: StoredSupportAssignee | null;
  unreadCount: number;
}) {
  return {
    id: ticket.id,
    organizationId: ticket.organizationId,
    protocol: ticket.protocol,
    subject: ticket.subject,
    status: isSupportTicketStatus(ticket.status) ? ticket.status : ("open" as const),
    priority: isSupportTicketPriority(ticket.priority) ? ticket.priority : ("medium" as const),
    requester: {
      name: ticket.requesterName,
      email: ticket.requesterEmail,
      organization: ticket.requesterOrganization ?? undefined,
    },
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    context: {
      screen: ticket.contextScreen,
      route: ticket.contextRoute,
      source: isSupportTicketSource(ticket.contextSource)
        ? ticket.contextSource
        : ("workspace" as const),
      entityLabel: ticket.contextEntityLabel ?? undefined,
    },
    attachments: attachments.map(serializeSupportAttachment),
    messages: messages.map(serializeSupportMessage),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    firstResponseDueAt: ticket.firstResponseDueAt.toISOString(),
    unreadCount,
  };
}

function groupByTicketId<T extends { ticketId: string }>(rows: T[]) {
  return rows.reduce((groups, row) => {
    const current = groups.get(row.ticketId);

    if (current) {
      current.push(row);
    } else {
      groups.set(row.ticketId, [row]);
    }

    return groups;
  }, new Map<string, T[]>());
}

export async function loadSupportTicketDetails({
  actor,
  db,
  tickets: ticketRows,
}: {
  actor: Actor;
  db: FastifyInstance["db"];
  tickets: StoredSupportTicket[];
}) {
  if (ticketRows.length === 0) {
    return [];
  }

  const ticketIds = ticketRows.map((ticket) => ticket.id);
  const assigneeIds = Array.from(
    new Set(ticketRows.map((ticket) => ticket.assigneeUserId).filter((id): id is string => !!id)),
  );

  const [messageRows, attachmentRows, readRows, assigneeRows] = await Promise.all([
    db.query.supportTicketMessages.findMany({
      where: inArray(supportTicketMessages.ticketId, ticketIds),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    }),
    db.query.supportTicketAttachments.findMany({
      where: inArray(supportTicketAttachments.ticketId, ticketIds),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    }),
    db.query.supportTicketReads.findMany({
      where: (table, { and, eq }) =>
        and(inArray(table.ticketId, ticketIds), eq(table.userId, actor.id)),
    }),
    assigneeIds.length > 0
      ? db.query.users.findMany({
          columns: {
            id: true,
            name: true,
          },
          where: inArray(users.id, assigneeIds),
        })
      : Promise.resolve([]),
  ]);

  const messagesByTicketId = groupByTicketId(messageRows);
  const attachmentsByTicketId = groupByTicketId(attachmentRows);
  const readsByTicketId = new Map(readRows.map((read) => [read.ticketId, read]));
  const assigneesById = new Map(assigneeRows.map((assignee) => [assignee.id, assignee]));

  return ticketRows.map((ticket) => {
    const messages = messagesByTicketId.get(ticket.id) ?? [];
    const attachments = attachmentsByTicketId.get(ticket.id) ?? [];
    const read = readsByTicketId.get(ticket.id);

    return serializeSupportTicket({
      ticket,
      messages,
      attachments,
      assignee: ticket.assigneeUserId ? assigneesById.get(ticket.assigneeUserId) : null,
      unreadCount: getSupportTicketUnreadCount({ actor, messages, read }),
    });
  });
}

export type SerializedSupportTicket = Awaited<ReturnType<typeof loadSupportTicketDetails>>[number];
