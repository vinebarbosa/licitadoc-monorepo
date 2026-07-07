import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { aiUsageQuerySchema, getAiUsageSchema } from "./ai-usage.schemas";
import { getAiUsage } from "./get-ai-usage";

export const registerAiUsageRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    "/",
    {
      schema: getAiUsageSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const query = aiUsageQuerySchema.parse(request.query);

      return getAiUsage({
        actor,
        db: app.db,
        query,
      });
    },
  );
};
