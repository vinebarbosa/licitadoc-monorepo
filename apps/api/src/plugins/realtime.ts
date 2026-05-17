import fp from "fastify-plugin";
import { resolveRealtimeProvider } from "../shared/realtime/resolve-provider";
import type { RealtimeProvider } from "../shared/realtime/types";

declare module "fastify" {
  interface FastifyInstance {
    realtime: RealtimeProvider;
  }
}

export const registerRealtimePlugin = fp(async (app) => {
  app.decorate(
    "realtime",
    resolveRealtimeProvider({
      provider: app.config.REALTIME_PROVIDER,
      ablyApiKey: app.config.ABLY_API_KEY,
    }),
  );
});
