import fp from "fastify-plugin";
import { resolveTextGenerationProvider } from "../shared/text-generation/resolve-provider";
import type { TextGenerationProvider } from "../shared/text-generation/types";

declare module "fastify" {
  interface FastifyInstance {
    textGeneration: TextGenerationProvider;
  }
}

export const registerTextGenerationPlugin = fp(async (app) => {
  const provider = resolveTextGenerationProvider({
    providerKey: app.config.TEXT_GENERATION_PROVIDER,
    model: app.config.TEXT_GENERATION_MODEL,
    apiKey: app.config.TEXT_GENERATION_API_KEY,
  });

  app.decorate("textGeneration", provider);
});
