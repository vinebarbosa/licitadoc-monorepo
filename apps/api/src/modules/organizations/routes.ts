import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { getOrganization } from "./get-organization";
import { getOrganizationSchema, updateOrganizationSchema } from "./organizations.schemas";
import { updateOrganization } from "./update-organization";

export const registerOrganizationRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/:organizationId",
    {
      schema: getOrganizationSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params as { organizationId: string };

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
      const { organizationId } = request.params as { organizationId: string };

      return updateOrganization({ actor, db: app.db, organizationId });
    },
  );
};
