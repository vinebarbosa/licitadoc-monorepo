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
  invitePaginationQuerySchema,
  resendInviteSchema,
  revokeInviteSchema,
} from "./invites.schemas";
import { resendInvite } from "./resend-invite";
import { revokeInvite } from "./revoke-invite";

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
        baseUrl: app.config.CORS_ORIGIN.split(",")[0]?.trim() || app.config.BETTER_AUTH_URL,
        email: request.body.email,
        mailer: app.mailer,
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
      const query = invitePaginationQuerySchema.parse(request.query);

      return getInvites({
        actor,
        db: app.db,
        page: query.page,
        pageSize: query.pageSize,
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
    "/:inviteId/resend",
    {
      schema: resendInviteSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return resendInvite({
        actor,
        db: app.db,
        baseUrl: app.config.CORS_ORIGIN.split(",")[0]?.trim() || app.config.BETTER_AUTH_URL,
        inviteId: request.params.inviteId,
        mailer: app.mailer,
      });
    },
  );

  app.patch(
    "/:inviteId/revoke",
    {
      schema: revokeInviteSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return revokeInvite({ actor, db: app.db, inviteId: request.params.inviteId });
    },
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
