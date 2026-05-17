import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { RealtimeProvider } from "../../shared/realtime/types";
import { getSupportActorName } from "./support-actors";
import { publishSupportTyping } from "./support-realtime";
import { canPublishSupportTicketTyping } from "./support-tickets.policies";
import type { PublishSupportTicketTypingInput } from "./support-tickets.schemas";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  logger?: FastifyBaseLogger;
  realtime: RealtimeProvider;
  ticketId: string;
  input: PublishSupportTicketTypingInput;
};

export async function publishSupportTicketTyping({
  actor,
  db,
  logger,
  realtime,
  ticketId,
  input,
}: Input) {
  const ticket = await db.query.supportTickets.findFirst({
    where: (table, { eq }) => eq(table.id, ticketId),
  });

  if (!ticket) {
    throw new NotFoundError("Support ticket not found.");
  }

  canPublishSupportTicketTyping(actor, ticket);

  await publishSupportTyping({
    actor,
    actorName: await getSupportActorName({ actor, db }),
    realtime,
    logger,
    ticket,
    isTyping: input.isTyping,
  });

  return { ok: true };
}
