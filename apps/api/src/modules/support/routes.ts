import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { createSupportRealtimeToken } from "./create-support-realtime-token";
import { createSupportTicket } from "./create-support-ticket";
import { createSupportTicketMessage } from "./create-support-ticket-message";
import { getSupportTicket } from "./get-support-ticket";
import { getSupportTickets } from "./get-support-tickets";
import { markSupportTicketRead } from "./mark-support-ticket-read";
import { publishSupportTicketTyping } from "./publish-support-ticket-typing";
import { getSupportTicketImageAttachment, uploadSupportTicketImage } from "./support-attachments";
import {
  createSupportRealtimeTokenSchema,
  createSupportTicketSchema,
  createSupportTicketMessageSchema,
  getSupportTicketImageAttachmentSchema,
  getMySupportTicketsSchema,
  getSupportTicketSchema,
  getSupportTicketsSchema,
  markSupportTicketReadSchema,
  publishSupportTicketTypingSchema,
  updateSupportTicketSchema,
  uploadSupportTicketImageSchema,
} from "./support-tickets.schemas";
import { updateSupportTicket } from "./update-support-ticket";

export const registerSupportTicketRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    "/",
    {
      schema: createSupportTicketSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const ticket = await createSupportTicket({
        actor,
        db: app.db,
        logger: app.log,
        realtime: app.realtime,
        input: request.body,
      });

      return reply.status(201).send(ticket);
    },
  );

  app.get(
    "/",
    {
      schema: getSupportTicketsSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getSupportTickets({
        actor,
        db: app.db,
        page: request.query.page,
        pageSize: request.query.pageSize,
        search: request.query.search,
        status: request.query.status,
        priority: request.query.priority,
        source: request.query.source,
        assignee: request.query.assignee,
      });
    },
  );

  app.get(
    "/me",
    {
      schema: getMySupportTicketsSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getSupportTickets({
        actor,
        db: app.db,
        page: request.query.page,
        pageSize: request.query.pageSize,
        search: request.query.search,
        status: request.query.status,
        priority: request.query.priority,
        source: request.query.source,
        assignee: request.query.assignee,
        requesterOnly: true,
      });
    },
  );

  app.post(
    "/attachments/images",
    {
      schema: uploadSupportTicketImageSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const image = await uploadSupportTicketImage({
        actor,
        body: request.body as Record<string, unknown> | undefined,
        maxBytes: app.config.SUPPORT_IMAGE_MAX_BYTES,
        storage: app.storage,
      });

      return reply.status(201).send(image);
    },
  );

  app.get(
    "/:ticketId/attachments/:attachmentId/image",
    {
      schema: getSupportTicketImageAttachmentSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const attachment = await getSupportTicketImageAttachment({
        actor,
        db: app.db,
        ticketId: request.params.ticketId,
        attachmentId: request.params.attachmentId,
      });
      const storedObject = await app.storage.getObject({ key: attachment.storageKey ?? "" });

      if (storedObject.contentLength != null) {
        reply.header("content-length", String(storedObject.contentLength));
      }

      return reply
        .type(attachment.mimeType ?? storedObject.contentType ?? "application/octet-stream")
        .send(storedObject.body);
    },
  );

  app.post(
    "/realtime/token",
    {
      schema: createSupportRealtimeTokenSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return createSupportRealtimeToken({
        actor,
        db: app.db,
        realtime: app.realtime,
        tokenTtlMs: app.config.REALTIME_TOKEN_TTL_MS,
        input: request.body,
      });
    },
  );

  app.get(
    "/:ticketId",
    {
      schema: getSupportTicketSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getSupportTicket({
        actor,
        db: app.db,
        ticketId: request.params.ticketId,
      });
    },
  );

  app.patch(
    "/:ticketId",
    {
      schema: updateSupportTicketSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return updateSupportTicket({
        actor,
        db: app.db,
        logger: app.log,
        realtime: app.realtime,
        ticketId: request.params.ticketId,
        input: request.body,
      });
    },
  );

  app.post(
    "/:ticketId/messages",
    {
      schema: createSupportTicketMessageSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const ticket = await createSupportTicketMessage({
        actor,
        db: app.db,
        logger: app.log,
        realtime: app.realtime,
        ticketId: request.params.ticketId,
        input: request.body,
      });

      return reply.status(201).send(ticket);
    },
  );

  app.post(
    "/:ticketId/read",
    {
      schema: markSupportTicketReadSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return markSupportTicketRead({
        actor,
        db: app.db,
        logger: app.log,
        realtime: app.realtime,
        ticketId: request.params.ticketId,
      });
    },
  );

  app.post(
    "/:ticketId/typing",
    {
      schema: publishSupportTicketTypingSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return publishSupportTicketTyping({
        actor,
        db: app.db,
        logger: app.log,
        realtime: app.realtime,
        ticketId: request.params.ticketId,
        input: request.body,
      });
    },
  );
};
