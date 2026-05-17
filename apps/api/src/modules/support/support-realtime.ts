import type { Actor } from "../../authorization/actor";
import type { RealtimeProvider } from "../../shared/realtime/types";
import {
  getSupportTicketChannel,
  getSupportTicketQueueChannel,
  type SerializedSupportTicket,
  type StoredSupportTicket,
  SUPPORT_TICKET_MESSAGE_CREATED_EVENT,
  SUPPORT_TICKET_READ_EVENT,
  SUPPORT_TICKET_TYPING_EVENT,
  SUPPORT_TICKET_UPDATED_EVENT,
} from "./support-tickets.shared";

type Logger = {
  warn: (input: Record<string, unknown>, message?: string) => void;
};

async function publishSafely({
  realtime,
  logger,
  channel,
  name,
  data,
}: {
  realtime: RealtimeProvider;
  logger?: Logger;
  channel: string;
  name: string;
  data: Record<string, unknown>;
}) {
  if (!realtime.isEnabled) {
    return;
  }

  try {
    await realtime.publish({ channel, name, data });
  } catch (error) {
    logger?.warn(
      {
        error,
        channel,
        eventName: name,
      },
      "Failed to publish support ticket realtime event.",
    );
  }
}

export async function publishSupportTicketUpdated({
  realtime,
  logger,
  ticket,
}: {
  realtime: RealtimeProvider;
  logger?: Logger;
  ticket: SerializedSupportTicket;
}) {
  const data = {
    type: SUPPORT_TICKET_UPDATED_EVENT,
    ticketId: ticket.id,
    organizationId: ticket.organizationId,
    ticket,
    occurredAt: new Date().toISOString(),
  };

  await publishSafely({
    realtime,
    logger,
    channel: getSupportTicketChannel(ticket.id),
    name: SUPPORT_TICKET_UPDATED_EVENT,
    data,
  });

  await publishSafely({
    realtime,
    logger,
    channel: getSupportTicketQueueChannel(ticket.organizationId),
    name: SUPPORT_TICKET_UPDATED_EVENT,
    data,
  });
}

export async function publishSupportMessageCreated({
  realtime,
  logger,
  ticket,
}: {
  realtime: RealtimeProvider;
  logger?: Logger;
  ticket: SerializedSupportTicket;
}) {
  const message = ticket.messages.at(-1);

  if (!message) {
    return;
  }

  const data = {
    type: SUPPORT_TICKET_MESSAGE_CREATED_EVENT,
    ticketId: ticket.id,
    organizationId: ticket.organizationId,
    message,
    ticket,
    occurredAt: new Date().toISOString(),
  };

  await publishSafely({
    realtime,
    logger,
    channel: getSupportTicketChannel(ticket.id),
    name: SUPPORT_TICKET_MESSAGE_CREATED_EVENT,
    data,
  });

  await publishSafely({
    realtime,
    logger,
    channel: getSupportTicketQueueChannel(ticket.organizationId),
    name: SUPPORT_TICKET_UPDATED_EVENT,
    data,
  });
}

export async function publishSupportTyping({
  actor,
  actorName,
  realtime,
  logger,
  ticket,
  isTyping,
}: {
  actor: Actor;
  actorName: string;
  realtime: RealtimeProvider;
  logger?: Logger;
  ticket: StoredSupportTicket;
  isTyping: boolean;
}) {
  await publishSafely({
    realtime,
    logger,
    channel: getSupportTicketChannel(ticket.id),
    name: SUPPORT_TICKET_TYPING_EVENT,
    data: {
      type: SUPPORT_TICKET_TYPING_EVENT,
      ticketId: ticket.id,
      organizationId: ticket.organizationId,
      actor: {
        id: actor.id,
        name: actorName,
      },
      isTyping,
      occurredAt: new Date().toISOString(),
    },
  });
}

export async function publishSupportRead({
  actor,
  realtime,
  logger,
  ticket,
}: {
  actor: Actor;
  realtime: RealtimeProvider;
  logger?: Logger;
  ticket: SerializedSupportTicket;
}) {
  const data = {
    type: SUPPORT_TICKET_READ_EVENT,
    ticketId: ticket.id,
    organizationId: ticket.organizationId,
    actorId: actor.id,
    unreadCount: ticket.unreadCount,
    occurredAt: new Date().toISOString(),
  };

  await publishSafely({
    realtime,
    logger,
    channel: getSupportTicketChannel(ticket.id),
    name: SUPPORT_TICKET_READ_EVENT,
    data,
  });

  await publishSafely({
    realtime,
    logger,
    channel: getSupportTicketQueueChannel(ticket.organizationId),
    name: SUPPORT_TICKET_UPDATED_EVENT,
    data,
  });
}
