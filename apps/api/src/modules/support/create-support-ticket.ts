import { randomUUID } from "node:crypto";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { supportTicketAttachments, supportTicketMessages, supportTickets } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { RealtimeProvider } from "../../shared/realtime/types";
import { normalizeSupportAttachmentInputs } from "./support-attachments";
import { publishSupportMessageCreated } from "./support-realtime";
import type { CreateSupportTicketInput } from "./support-tickets.schemas";
import { loadSupportTicketDetails } from "./support-tickets.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  logger?: FastifyBaseLogger;
  realtime: RealtimeProvider;
  input: CreateSupportTicketInput;
};

function createSupportProtocol() {
  return `LD-SUP-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createSupportTicket({ actor, db, logger, realtime, input }: Input) {
  if (!actor.organizationId) {
    throw new BadRequestError("User must belong to an organization to create support tickets.");
  }

  const [requester, organization] = await Promise.all([
    db.query.users.findFirst({
      columns: {
        id: true,
        name: true,
        email: true,
      },
      where: (table, { eq }) => eq(table.id, actor.id),
    }),
    db.query.organizations.findFirst({
      columns: {
        id: true,
        name: true,
        officialName: true,
      },
      where: (table, { eq }) => eq(table.id, actor.organizationId ?? ""),
    }),
  ]);

  if (!requester) {
    throw new NotFoundError("User not found.");
  }

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  const firstResponseDueAt = new Date(Date.now() + 8 * 60_000);
  const attachments = normalizeSupportAttachmentInputs({
    actor,
    attachment: input.attachment,
    attachments: input.attachments,
  });

  const { createdTicket } = await db.transaction(async (tx) => {
    const [ticket] = await tx
      .insert(supportTickets)
      .values({
        organizationId: actor.organizationId ?? organization.id,
        protocol: createSupportProtocol(),
        subject: input.subject,
        status: "open",
        priority: "medium",
        requesterUserId: actor.id,
        requesterName: requester.name,
        requesterEmail: requester.email,
        requesterOrganization: organization.officialName || organization.name,
        assigneeUserId: null,
        contextScreen: input.context.screen,
        contextRoute: input.context.route,
        contextSource: input.context.source,
        contextEntityLabel: input.context.entityLabel,
        firstResponseDueAt,
      })
      .returning();

    if (!ticket) {
      throw new NotFoundError("Support ticket could not be created.");
    }

    const [message] = await tx
      .insert(supportTicketMessages)
      .values({
        ticketId: ticket.id,
        organizationId: ticket.organizationId,
        authorUserId: actor.id,
        role: "user",
        authorName: requester.name,
        content: input.content,
      })
      .returning();

    if (!message) {
      throw new NotFoundError("Support ticket message could not be created.");
    }

    for (const attachment of attachments) {
      await tx.insert(supportTicketAttachments).values({
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

    return { createdTicket: ticket };
  });

  const [detail] = await loadSupportTicketDetails({ actor, db, tickets: [createdTicket] });

  if (!detail) {
    throw new NotFoundError("Support ticket not found.");
  }

  await publishSupportMessageCreated({
    realtime,
    logger,
    ticket: detail,
  });

  return detail;
}
