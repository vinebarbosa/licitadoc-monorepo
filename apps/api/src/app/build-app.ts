import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-zod-openapi";
import { registerAuthRoutes } from "../modules/auth/routes";
import { registerDepartmentRoutes } from "../modules/departments/routes";
import { registerDocumentRoutes } from "../modules/documents/routes";
import { registerInviteRoutes } from "../modules/invites/routes";
import { registerOrganizationRoutes } from "../modules/organizations/routes";
import { registerProcessRoutes } from "../modules/processes/routes";
import { registerUserRoutes } from "../modules/users/routes";
import { registerAuthPlugin } from "../plugins/auth";
import { registerCorsPlugin } from "../plugins/cors";
import { registerDatabasePlugin } from "../plugins/db";
import { registerEnvPlugin } from "../plugins/env";
import { registerErrorPlugin } from "../plugins/errors";
import { registerMultipartPlugin } from "../plugins/multipart";
import { registerOpenApiPlugin } from "../plugins/openapi";
import { registerSecurityPlugin } from "../plugins/security";
import { registerStoragePlugin } from "../plugins/storage";
import { registerTextGenerationPlugin } from "../plugins/text-generation";
import { type AppRouteSchema, type AppTypeProvider, z } from "../shared/http/zod";

export async function buildApp() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  const app = Fastify({
    logger: {
      level: "info",
      redact: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"],
      transport: isDevelopment
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname,reqId,req,res,responseTime",
              messageFormat: "{msg}",
            },
          }
        : undefined,
    },
    disableRequestLogging: isDevelopment,
  });
  const typedApp = app.withTypeProvider<AppTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(sensible);
  await app.register(registerEnvPlugin);
  await app.register(registerSecurityPlugin);
  await app.register(registerCorsPlugin);
  await app.register(registerMultipartPlugin);
  await app.register(registerDatabasePlugin);
  await app.register(registerAuthPlugin);
  await app.register(registerStoragePlugin);
  await app.register(registerTextGenerationPlugin);
  await app.register(registerOpenApiPlugin);
  await app.register(registerErrorPlugin);

  await app.register(registerAuthRoutes, { prefix: "/api/auth" });
  await app.register(registerInviteRoutes, { prefix: "/api/invites" });
  await app.register(registerUserRoutes, { prefix: "/api/users" });
  await app.register(registerOrganizationRoutes, { prefix: "/api/organizations" });
  await app.register(registerDepartmentRoutes, { prefix: "/api/departments" });
  await app.register(registerProcessRoutes, { prefix: "/api/processes" });
  await app.register(registerDocumentRoutes, { prefix: "/api/documents" });

  if (isDevelopment) {
    app.addHook("onResponse", async (request, reply) => {
      if (request.method === "OPTIONS") {
        return;
      }

      const responseTime = reply.elapsedTime.toFixed(1);
      app.log.info(`${request.method} ${request.url} -> ${reply.statusCode} ${responseTime}ms`);
    });
  }

  typedApp.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Application health",
        response: {
          200: z.object({
            status: z.string().meta({
              examples: ["ok"],
            }),
          }),
        },
      } satisfies AppRouteSchema,
    },
    async () => ({ status: "ok" }),
  );

  app.get(
    "/openapi.json",
    {
      schema: {
        hide: true,
      },
    },
    async () => app.getOpenApiDocument(),
  );

  return app;
}
