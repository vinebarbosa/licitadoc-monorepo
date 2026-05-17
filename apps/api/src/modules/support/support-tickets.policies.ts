import type { Actor } from "../../authorization/actor";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import type { StoredSupportTicket } from "./support-tickets.shared";

export function canListSupportTickets(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner" || actor.role === "member") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to list support tickets.");
}

export function canReadStoredSupportTicket(
  actor: Actor,
  ticket: Pick<StoredSupportTicket, "organizationId" | "requesterUserId">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (ticket.requesterUserId && ticket.requesterUserId === actor.id) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read this support ticket.");
}

export function canSendSupportTicketMessage(
  actor: Actor,
  ticket: Pick<StoredSupportTicket, "organizationId" | "requesterUserId">,
) {
  return canReadStoredSupportTicket(actor, ticket);
}

export function canMarkSupportTicketRead(
  actor: Actor,
  ticket: Pick<StoredSupportTicket, "organizationId" | "requesterUserId">,
) {
  return canReadStoredSupportTicket(actor, ticket);
}

export function canPublishSupportTicketTyping(
  actor: Actor,
  ticket: Pick<StoredSupportTicket, "organizationId" | "requesterUserId">,
) {
  return canReadStoredSupportTicket(actor, ticket);
}

export function canUpdateStoredSupportTicket(actor: Actor) {
  if (actor.role === "admin") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to update this support ticket.");
}

export function canSubscribeToSupportQueue(actor: Actor, organizationId: string) {
  if (actor.role === "admin") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to subscribe to this support queue.");
}
