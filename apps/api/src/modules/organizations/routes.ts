import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { createOrganization } from "./create-organization";
import { getOrganization } from "./get-organization";
import { getOrganizations } from "./get-organizations";
import {
  createOrganizationSchema,
  getOrganizationSchema,
  getOrganizationsSchema,
  updateOrganizationSchema,
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
