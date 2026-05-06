import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { createDocument } from "./create-document";
import { createDocumentSchema, getDocumentSchema, getDocumentsSchema } from "./documents.schemas";
import { getDocument } from "./get-document";
import { getDocuments } from "./get-documents";

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
};
