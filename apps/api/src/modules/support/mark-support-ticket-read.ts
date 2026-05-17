import { and, eq } from "drizzle-orm";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { supportTicketReads } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { RealtimeProvider } from "../../shared/realtime/types";
import { getSupportTicket } from "./get-support-ticket";
import { publishSupportRead } from "./support-realtime";
import { canMarkSupportTicketRead } from "./support-tickets.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  logger?: FastifyBaseLogger;
  realtime: RealtimeProvider;
  ticketId: string;
};

export async function markSupportTicketRead({ actor, db, logger, realtime, ticketId }: Input) {
  const currentTicket = await db.query.supportTickets.findFirst({
    where: (table, { eq: equals }) => equals(table.id, ticketId),
  });

  if (!currentTicket) {
    throw new NotFoundError("Support ticket not found.");
  }

  canMarkSupportTicketRead(actor, currentTicket);

  const readAt = new Date();
  const [updatedRead] = await db
    .update(supportTicketReads)
    .set({ readAt })
    .where(and(eq(supportTicketReads.ticketId, ticketId), eq(supportTicketReads.userId, actor.id)))
    .returning();

  if (!updatedRead) {
    await db.insert(supportTicketReads).values({
      ticketId,
      userId: actor.id,
      readAt,
    });
  }

  const ticket = await getSupportTicket({ actor, db, ticketId });

  await publishSupportRead({
    actor,
    realtime,
    logger,
    ticket,
  });

  return ticket;
}
