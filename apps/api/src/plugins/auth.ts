import fp from "fastify-plugin";
import { type AuthInstance, createAuth } from "../shared/auth/auth";

declare module "fastify" {
  interface FastifyInstance {
    auth: AuthInstance;
  }
}

export const registerAuthPlugin = fp(async (app) => {
  const auth = createAuth(app);

  app.decorate("auth", auth);
});
