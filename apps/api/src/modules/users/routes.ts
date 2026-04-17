import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { getUser } from "./get-user";
import { getUsers } from "./get-users";
import { getUserSchema, getUsersSchema } from "./users.schemas";

export const registerUserRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/",
    {
      schema: getUsersSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getUsers({ actor, db: app.db });
    },
  );

  app.get(
    "/:userId",
    {
      schema: getUserSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { userId } = request.params as { userId: string };

      return getUser({ actor, db: app.db, userId });
    },
  );
};
