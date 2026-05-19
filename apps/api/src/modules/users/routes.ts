import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { completeOwnerProfileOnboarding } from "./complete-owner-profile-onboarding";
import { deleteUser } from "./delete-user";
import { getUser } from "./get-user";
import { getUsers } from "./get-users";
import { updateUser } from "./update-user";
import {
  completeOwnerProfileOnboardingSchema,
  deleteUserSchema,
  getUserSchema,
  getUsersSchema,
  updateUserSchema,
} from "./users.schemas";

export const registerUserRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  // User creation stays in the invite + auth flow; this module only manages stored users.
  app.get(
    "/",
    {
      schema: getUsersSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getUsers({
        actor,
        db: app.db,
        page: request.query.page,
        pageSize: request.query.pageSize,
        search: request.query.search,
        role: request.query.role,
        organizationId: request.query.organizationId,
      });
    },
  );

  app.post(
    "/me/onboarding/profile",
    {
      schema: completeOwnerProfileOnboardingSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return completeOwnerProfileOnboarding({
        actor,
        db: app.db,
        profile: request.body,
      });
    },
  );

  app.get(
    "/:userId",
    {
      schema: getUserSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { userId } = request.params;

      return getUser({ actor, db: app.db, userId });
    },
  );

  app.patch(
    "/:userId",
    {
      schema: updateUserSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { userId } = request.params;

      return updateUser({
        actor,
        db: app.db,
        userId,
        changes: request.body,
      });
    },
  );

  app.delete(
    "/:userId",
    {
      schema: deleteUserSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { userId } = request.params;

      return deleteUser({ actor, db: app.db, userId });
    },
  );
};
