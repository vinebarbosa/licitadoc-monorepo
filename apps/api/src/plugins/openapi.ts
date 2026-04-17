import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import { loadAuthOpenApiDocument, mergeOpenApiDocuments } from "./openapi-helpers";

declare module "fastify" {
  interface FastifyInstance {
    getOpenApiDocument: () => Promise<Record<string, unknown>>;
  }
}

export const registerOpenApiPlugin = fp(async (app) => {
  let authOpenApiDocument: Record<string, unknown> | null = null;

  await app.register(swagger, {
    openapi: {
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
        { name: "Users" },
        { name: "Organizations" },
        { name: "Processes" },
        { name: "Documents" },
      ],
    },
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

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    transformSpecification: (swaggerObject) =>
      mergeOpenApiDocuments(
        swaggerObject as Parameters<typeof mergeOpenApiDocuments>[0],
        authOpenApiDocument as Parameters<typeof mergeOpenApiDocuments>[1],
      ) as Record<string, unknown>,
  });
});
