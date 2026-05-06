import fp from "fastify-plugin";
import type { InviteMailer } from "../shared/email/invite-mailer";
import { resolveInviteMailer } from "../shared/email/resolve-invite-mailer";

declare module "fastify" {
  interface FastifyInstance {
    mailer: InviteMailer;
  }
}

export const registerMailerPlugin = fp(async (app) => {
  const mailer = resolveInviteMailer({
    apiKey: app.config.RESEND_API_KEY,
    fromEmail: app.config.RESEND_FROM_EMAIL,
    providerKey: app.config.INVITE_EMAIL_PROVIDER,
  });

  app.decorate("mailer", mailer);
});
