import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { createOrganization } from "./create-organization";
import { getCurrentOrganization } from "./get-current-organization";
import { getOrganization } from "./get-organization";
import { getOrganizations } from "./get-organizations";
import {
  getOrganizationLetterheadImage,
  uploadOrganizationLetterhead,
} from "./organization-letterhead";
import {
  createOrganizationSchema,
  getCurrentOrganizationSchema,
  getOrganizationLetterheadImageSchema,
  getOrganizationSchema,
  getOrganizationsSchema,
  updateOrganizationSchema,
  uploadOrganizationLetterheadSchema,
} from "./organizations.schemas";
import { updateOrganization } from "./update-organization";

export const registerOrganizationRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  // Organization deletion remains out of scope for this change.
  app.post(
    "/",
    {
      schema: createOrganizationSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const organization = await createOrganization({
        actor,
        db: app.db,
        organization: request.body,
      });

      return reply.status(201).send(organization);
    },
  );

  app.get(
    "/",
    {
      schema: getOrganizationsSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getOrganizations({
        actor,
        db: app.db,
        page: request.query.page,
        pageSize: request.query.pageSize,
      });
    },
  );

  app.get(
    "/me",
    {
      schema: getCurrentOrganizationSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getCurrentOrganization({ actor, db: app.db });
    },
  );

  app.get(
    "/:organizationId",
    {
      schema: getOrganizationSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;

      return getOrganization({ actor, db: app.db, organizationId });
    },
  );

  app.post(
    "/:organizationId/letterhead",
    {
      schema: uploadOrganizationLetterheadSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;
      const organization = await uploadOrganizationLetterhead({
        actor,
        body: request.body as Record<string, unknown> | undefined,
        db: app.db,
        maxBytes: app.config.SUPPORT_IMAGE_MAX_BYTES,
        organizationId,
        storage: app.storage,
      });

      return reply.status(201).send(organization);
    },
  );

  app.get(
    "/:organizationId/letterhead/image",
    {
      schema: getOrganizationLetterheadImageSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;
      const letterhead = await getOrganizationLetterheadImage({
        actor,
        db: app.db,
        organizationId,
      });
      const storedObject = await app.storage.getObject({ key: letterhead.storageKey });

      if (storedObject.contentLength != null) {
        reply.header("content-length", String(storedObject.contentLength));
      }

      reply.header("cache-control", "private, max-age=300");
      reply.header(
        "content-disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(letterhead.fileName)}`,
      );

      return reply
        .type(storedObject.contentType ?? "application/octet-stream")
        .send(storedObject.body);
    },
  );

  app.patch(
    "/:organizationId",
    {
      schema: updateOrganizationSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;

      return updateOrganization({
        actor,
        db: app.db,
        organizationId,
        changes: request.body,
      });
    },
  );
};
