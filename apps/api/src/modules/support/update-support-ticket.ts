import { eq } from "drizzle-orm";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { supportTickets, users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { RealtimeProvider } from "../../shared/realtime/types";
import { publishSupportTicketUpdated } from "./support-realtime";
import {
  canReadStoredSupportTicket,
  canUpdateStoredSupportTicket,
} from "./support-tickets.policies";
import type { UpdateSupportTicketInput } from "./support-tickets.schemas";
import { loadSupportTicketDetails } from "./support-tickets.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  logger?: FastifyBaseLogger;
  realtime: RealtimeProvider;
  ticketId: string;
  input: UpdateSupportTicketInput;
};

export async function updateSupportTicket({ actor, db, logger, realtime, ticketId, input }: Input) {
  const ticket = await db.query.supportTickets.findFirst({
    where: (table, { eq: equals }) => equals(table.id, ticketId),
  });

  if (!ticket) {
    throw new NotFoundError("Support ticket not found.");
  }

  canReadStoredSupportTicket(actor, ticket);
  canUpdateStoredSupportTicket(actor);

  if (input.assigneeUserId) {
    const assignee = await db.query.users.findFirst({
      where: eq(users.id, input.assigneeUserId),
    });

    if (!assignee) {
      throw new BadRequestError("Assignee user not found.");
    }
  }

  const [updatedTicket] = await db
    .update(supportTickets)
    .set({
      status: input.status ?? ticket.status,
      priority: input.priority ?? ticket.priority,
      assigneeUserId:
        "assigneeUserId" in input ? (input.assigneeUserId ?? null) : ticket.assigneeUserId,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticket.id))
    .returning();

  if (!updatedTicket) {
    throw new NotFoundError("Support ticket not found.");
  }

  const [detail] = await loadSupportTicketDetails({ actor, db, tickets: [updatedTicket] });

  await publishSupportTicketUpdated({
    realtime,
    logger,
    ticket: detail,
  });

  return detail;
}
