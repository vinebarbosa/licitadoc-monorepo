import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { supportTickets } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadStoredSupportTicket } from "./support-tickets.policies";
import { loadSupportTicketDetails } from "./support-tickets.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  ticketId: string;
};

export async function getSupportTicket({ actor, db, ticketId }: Input) {
  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, ticketId),
  });

  if (!ticket) {
    throw new NotFoundError("Support ticket not found.");
  }

  canReadStoredSupportTicket(actor, ticket);

  const [detail] = await loadSupportTicketDetails({ actor, db, tickets: [ticket] });

  return detail;
}
