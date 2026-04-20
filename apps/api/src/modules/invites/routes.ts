import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { acceptInvite } from "./accept-invite";
import { createInvite } from "./create-invite";
import { getInviteByToken } from "./get-invite-by-token";
import { getInvites } from "./get-invites";
import {
  acceptInviteSchema,
  createInviteSchema,
  getInviteByTokenSchema,
  getInvitesSchema,
} from "./invites.schemas";

export const registerInviteRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    "/",
    {
      schema: createInviteSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const invite = await createInvite({
        actor,
        db: app.db,
        baseUrl: app.config.BETTER_AUTH_URL,
        email: request.body.email,
        organizationId: request.body.organizationId,
      });

      return reply.status(201).send(invite);
    },
  );

  app.get(
    "/",
    {
      schema: getInvitesSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getInvites({
        actor,
        db: app.db,
        page: request.query.page,
        pageSize: request.query.pageSize,
      });
    },
  );

  app.get(
    "/:inviteToken",
    {
      schema: getInviteByTokenSchema,
    },
    async (request) => getInviteByToken({ db: app.db, inviteToken: request.params.inviteToken }),
  );

  app.post(
    "/:inviteToken/accept",
    {
      schema: acceptInviteSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return acceptInvite({ actor, db: app.db, inviteToken: request.params.inviteToken });
    },
  );
};
