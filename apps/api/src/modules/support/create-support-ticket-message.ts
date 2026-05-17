import { eq } from "drizzle-orm";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { supportTicketAttachments, supportTicketMessages, supportTickets } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { RealtimeProvider } from "../../shared/realtime/types";
import { normalizeSupportAttachmentInputs } from "./support-attachments";
import { getSupportActorName } from "./support-actors";
import { publishSupportMessageCreated } from "./support-realtime";
import { canSendSupportTicketMessage } from "./support-tickets.policies";
import type { CreateSupportTicketMessageInput } from "./support-tickets.schemas";
import { loadSupportTicketDetails, resolveSupportMessageRole } from "./support-tickets.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  logger?: FastifyBaseLogger;
  realtime: RealtimeProvider;
  ticketId: string;
  input: CreateSupportTicketMessageInput;
};

export async function createSupportTicketMessage({
  actor,
  db,
  logger,
  realtime,
  ticketId,
  input,
}: Input) {
  const ticket = await db.query.supportTickets.findFirst({
    where: (table, { eq: equals }) => equals(table.id, ticketId),
  });

  if (!ticket) {
    throw new NotFoundError("Support ticket not found.");
  }

  canSendSupportTicketMessage(actor, ticket);

  const authorName = await getSupportActorName({ actor, db });
  const role = resolveSupportMessageRole(actor);
  const updatedAt = new Date();
  const attachments = normalizeSupportAttachmentInputs({
    actor,
    attachments: input.attachments,
  });
  const content = input.content?.trim() || (attachments.length > 0 ? "Imagem anexada" : "");

  if (!content) {
    throw new BadRequestError("Content or attachment is required.");
  }

  const [message] = await db
    .insert(supportTicketMessages)
    .values({
      ticketId: ticket.id,
      organizationId: ticket.organizationId,
      authorUserId: actor.id,
      role,
      authorName,
      content,
    })
    .returning();

  if (!message) {
    throw new NotFoundError("Support ticket message could not be created.");
  }

  for (const attachment of attachments) {
    await db.insert(supportTicketAttachments).values({
      ticketId: ticket.id,
      messageId: message.id,
      type: attachment.type,
      name: attachment.name,
      description: attachment.description,
      storageKey: attachment.storageKey,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    });
  }

  const nextStatus =
    ticket.status === "resolved" ? "resolved" : role === "support" ? "waiting" : "open";
  const [updatedTicket] = await db
    .update(supportTickets)
    .set({
      status: nextStatus,
      assigneeUserId:
        role === "support" ? (ticket.assigneeUserId ?? actor.id) : ticket.assigneeUserId,
      updatedAt,
    })
    .where(eq(supportTickets.id, ticket.id))
    .returning();

  if (!updatedTicket) {
    throw new NotFoundError("Support ticket not found.");
  }

  const [detail] = await loadSupportTicketDetails({ actor, db, tickets: [updatedTicket] });

  await publishSupportMessageCreated({
    realtime,
    logger,
    ticket: detail,
  });

  return detail;
}
