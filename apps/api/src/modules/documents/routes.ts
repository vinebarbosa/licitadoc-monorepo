import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { createDocument } from "./create-document";
import type { DocumentGenerationEvent } from "./document-generation-events";
import {
  applyDocumentTextAdjustment,
  suggestDocumentTextAdjustment,
} from "./document-text-adjustment";
import { canReadStoredDocument } from "./documents.policies";
import {
  applyDocumentTextAdjustmentSchema,
  createDocumentSchema,
  documentParamsSchema,
  getDocumentSchema,
  getDocumentsSchema,
  suggestDocumentTextAdjustmentSchema,
  updateDocumentSchema,
} from "./documents.schemas";
import { getDocument } from "./get-document";
import { getDocuments } from "./get-documents";
import { updateDocument } from "./update-document";

type SseWritableStream = {
  write: (chunk: string) => boolean | undefined;
  flush?: () => void;
  flushHeaders?: () => void;
  socket?: {
    setNoDelay?: (noDelay?: boolean) => void;
  } | null;
};

function flushSseStream(raw: SseWritableStream) {
  raw.flush?.();
}

export function configureDocumentGenerationEventsStream(raw: SseWritableStream) {
  raw.socket?.setNoDelay?.(true);
  raw.flushHeaders?.();
}

export function writeSseComment(raw: SseWritableStream, comment: string) {
  raw.write(`: ${comment}\n\n`);
  flushSseStream(raw);
}

export function writeSseEvent(
  raw: SseWritableStream,
  event: DocumentGenerationEvent,
  options: { now?: () => Date } = {},
) {
  const serverSentAt = (options.now ?? (() => new Date()))().toISOString();
  const payload = {
    ...event,
    serverSentAt,
  };

  raw.write(`event: ${event.type}\ndata: ${JSON.stringify(payload)}\n\n`);
  flushSseStream(raw);
}

export function resolveDocumentGenerationEventsCorsOrigin({
  corsOrigin,
  requestOrigin,
}: {
  corsOrigin: string;
  requestOrigin: string | undefined;
}) {
  if (!requestOrigin) {
    return undefined;
  }

  const allowedOrigins = corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : undefined;
}

export function createDocumentGenerationEventsHeaders({
  corsOrigin,
  requestOrigin,
}: {
  corsOrigin: string;
  requestOrigin: string | undefined;
}) {
  const headers: Record<string, string> = {
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "content-type": "text/event-stream; charset=utf-8",
    "x-accel-buffering": "no",
  };
  const allowedOrigin = resolveDocumentGenerationEventsCorsOrigin({
    corsOrigin,
    requestOrigin,
  });

  if (!allowedOrigin) {
    return headers;
  }

  return {
    ...headers,
    "access-control-allow-credentials": "true",
    "access-control-allow-origin": allowedOrigin,
    vary: "Origin",
  };
}

export const registerDocumentRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    "/",
    {
      schema: createDocumentSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const document = await createDocument({
        actor,
        db: app.db,
        document: request.body,
        scheduleGeneration: app.documentGenerationQueue.schedule,
      });

      return reply.status(201).send(document);
    },
  );

  app.get(
    "/",
    {
      schema: getDocumentsSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getDocuments({ actor, db: app.db });
    },
  );

  app.get(
    "/:documentId/events",
    {
      schema: {
        hide: true,
        params: documentParamsSchema,
      },
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { documentId } = request.params;
      const document = await app.db.query.documents.findFirst({
        where: (table, { eq }) => eq(table.id, documentId),
      });

      if (!document) {
        throw new NotFoundError("Document not found.");
      }

      canReadStoredDocument(actor, document);

      reply.hijack();
      reply.raw.writeHead(
        200,
        createDocumentGenerationEventsHeaders({
          corsOrigin: app.config.CORS_ORIGIN,
          requestOrigin: request.headers.origin,
        }),
      );
      configureDocumentGenerationEventsStream(reply.raw);
      writeSseComment(reply.raw, "connected");

      for (const snapshot of app.documentGenerationEvents.getSnapshots(documentId)) {
        writeSseEvent(reply.raw, snapshot);
      }

      const unsubscribe = app.documentGenerationEvents.subscribe(documentId, (event) => {
        writeSseEvent(reply.raw, event);
      });
      const heartbeat = setInterval(() => {
        writeSseComment(reply.raw, "keep-alive");
      }, 15_000);
      let isClosed = false;

      const cleanup = () => {
        if (isClosed) {
          return;
        }

        isClosed = true;
        clearInterval(heartbeat);
        unsubscribe();
      };

      request.raw.on("close", cleanup);
    },
  );

  app.get(
    "/:documentId",
    {
      schema: getDocumentSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { documentId } = request.params;

      return getDocument({ actor, db: app.db, documentId });
    },
  );

  app.patch(
    "/:documentId",
    {
      schema: updateDocumentSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { documentId } = request.params;

      return updateDocument({
        actor,
        db: app.db,
        documentId,
        input: request.body,
      });
    },
  );

  app.post(
    "/:documentId/adjustments/suggestions",
    {
      schema: suggestDocumentTextAdjustmentSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { documentId } = request.params;

      return suggestDocumentTextAdjustment({
        actor,
        db: app.db,
        documentId,
        input: request.body,
        textGeneration: app.textGeneration,
      });
    },
  );

  app.post(
    "/:documentId/adjustments/apply",
    {
      schema: applyDocumentTextAdjustmentSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { documentId } = request.params;

      return applyDocumentTextAdjustment({
        actor,
        db: app.db,
        documentId,
        input: request.body,
      });
    },
  );
};
