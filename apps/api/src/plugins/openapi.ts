import swagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import fp from "fastify-plugin";
import { fastifyZodOpenApiPlugin, fastifyZodOpenApiTransformers } from "fastify-zod-openapi";
import { loadAuthOpenApiDocument, mergeOpenApiDocuments } from "./openapi-helpers";

declare module "fastify" {
  interface FastifyInstance {
    getOpenApiDocument: () => Promise<Record<string, unknown>>;
  }
}

export const registerOpenApiPlugin = fp(async (app) => {
  let authOpenApiDocument: Record<string, unknown> | null = null;

  await app.register(fastifyZodOpenApiPlugin);

  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Licitadoc API",
        description: "OpenAPI document generated from Fastify route schemas.",
        version: "0.1.0",
      },
      servers: [
        {
          url: app.config.BETTER_AUTH_URL,
        },
      ],
      tags: [
        { name: "Health" },
        { name: "Auth" },
        { name: "Auth - Access" },
        { name: "Auth - Accounts" },
        { name: "Auth - Callbacks" },
        { name: "Auth - Credentials" },
        { name: "Auth - Meta" },
        { name: "Auth - Sessions" },
        { name: "Invites" },
        { name: "Users" },
        { name: "Organizations" },
        { name: "Departments" },
        { name: "Processes" },
        { name: "Documents" },
      ],
    },
    ...fastifyZodOpenApiTransformers,
  });

  app.decorate("getOpenApiDocument", async () => {
    const baseDocument = app.swagger() as Record<string, unknown>;

    return mergeOpenApiDocuments(
      baseDocument,
      authOpenApiDocument as Parameters<typeof mergeOpenApiDocuments>[1],
    ) as Record<string, unknown>;
  });

  app.addHook("onReady", async () => {
    authOpenApiDocument = (await loadAuthOpenApiDocument(app)) as Record<string, unknown> | null;
  });

  await app.register(ScalarApiReference, {
    routePrefix: "/docs",
    configuration: {
      title: "Licitadoc API",
      url: "/openapi.json",
    },
  });
});
