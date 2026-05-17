import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { RealtimeCapability, RealtimeProvider } from "../../shared/realtime/types";
import { canReadStoredSupportTicket, canSubscribeToSupportQueue } from "./support-tickets.policies";
import type { SupportRealtimeTokenInput } from "./support-tickets.schemas";
import { getSupportTicketChannel, getSupportTicketQueueChannel } from "./support-tickets.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  realtime: RealtimeProvider;
  tokenTtlMs: number;
  input: SupportRealtimeTokenInput;
};

export async function createSupportRealtimeToken({
  actor,
  db,
  realtime,
  tokenTtlMs,
  input,
}: Input) {
  const channels: string[] = [];

  if (input.ticketId) {
    const ticket = await db.query.supportTickets.findFirst({
      where: (table, { eq }) => eq(table.id, input.ticketId ?? ""),
    });

    if (!ticket) {
      throw new NotFoundError("Support ticket not found.");
    }

    canReadStoredSupportTicket(actor, ticket);
    channels.push(getSupportTicketChannel(ticket.id));
  }

  if (input.organizationId) {
    canSubscribeToSupportQueue(actor, input.organizationId);
    channels.push(getSupportTicketQueueChannel(input.organizationId));
  }

  const capability = channels.reduce<RealtimeCapability>((acc, channel) => {
    acc[channel] = ["subscribe"];
    return acc;
  }, {});
  const token = await realtime.createTokenRequest({
    clientId: actor.id,
    capability,
    ttlMs: tokenTtlMs,
  });

  return {
    ...token,
    channels,
  };
}
