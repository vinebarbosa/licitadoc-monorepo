import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { getDocumentSchema, getDocumentsSchema } from "./documents.schemas";
import { getDocument } from "./get-document";
import { getDocuments } from "./get-documents";

export const registerDocumentRoutes: FastifyPluginAsync = async (app) => {
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
      const { documentId } = request.params as { documentId: string };

      return getDocument({ actor, db: app.db, documentId });
    },
  );
};
