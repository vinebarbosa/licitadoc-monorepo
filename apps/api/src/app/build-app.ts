import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { registerAuthRoutes } from "../modules/auth/routes";
import { registerDocumentRoutes } from "../modules/documents/routes";
import { registerOrganizationRoutes } from "../modules/organizations/routes";
import { registerProcessRoutes } from "../modules/processes/routes";
import { registerUserRoutes } from "../modules/users/routes";
import { registerAuthPlugin } from "../plugins/auth";
import { registerCorsPlugin } from "../plugins/cors";
import { registerDatabasePlugin } from "../plugins/db";
import { registerEnvPlugin } from "../plugins/env";
import { registerErrorPlugin } from "../plugins/errors";
import { registerOpenApiPlugin } from "../plugins/openapi";
import { registerSecurityPlugin } from "../plugins/security";

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

  await app.register(sensible);
  await app.register(registerEnvPlugin);
  await app.register(registerSecurityPlugin);
  await app.register(registerCorsPlugin);
  await app.register(registerDatabasePlugin);
  await app.register(registerAuthPlugin);
  await app.register(registerOpenApiPlugin);
  await app.register(registerErrorPlugin);

  await app.register(registerAuthRoutes, { prefix: "/api/auth" });
  await app.register(registerUserRoutes, { prefix: "/api/users" });
  await app.register(registerOrganizationRoutes, { prefix: "/api/organizations" });
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

  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Application health",
        response: {
          200: {
            type: "object",
            required: ["status"],
            properties: {
              status: { type: "string", examples: ["ok"] },
            },
          },
        },
      },
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
