import type { FastifyInstance } from "fastify";

type OpenApiDocument = {
  openapi?: string;
  tags?: Array<{ name?: string; description?: string }>;
  paths?: Record<string, unknown>;
  components?: Record<string, unknown>;
  security?: unknown[];
};

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;
const AUTH_BASE_PATH = "/api/auth";

function getAuthTagName(pathname: string) {
  if (
    pathname.includes("/sign-in") ||
    pathname.includes("/sign-up") ||
    pathname.includes("/sign-out")
  ) {
    return "Auth - Access";
  }

  if (
    pathname.includes("/verify-email") ||
    pathname.includes("/send-verification-email") ||
    pathname.includes("/change-email") ||
    pathname.includes("/change-password") ||
    pathname.includes("/verify-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/request-password-reset")
  ) {
    return "Auth - Credentials";
  }

  if (
    pathname.includes("/get-session") ||
    pathname.includes("/update-session") ||
    pathname.includes("/list-sessions") ||
    pathname.includes("/revoke-session") ||
    pathname.includes("/revoke-sessions") ||
    pathname.includes("/revoke-other-sessions") ||
    pathname.includes("/refresh-token")
  ) {
    return "Auth - Sessions";
  }

  if (
    pathname.includes("/update-user") ||
    pathname.includes("/delete-user") ||
    pathname.includes("/list-accounts") ||
    pathname.includes("/account") ||
    pathname.includes("/accounts") ||
    pathname.includes("/link-social") ||
    pathname.includes("/unlink-account") ||
    pathname.includes("/get-access-token")
  ) {
    return "Auth - Accounts";
  }

  if (pathname.includes("/callback")) {
    return "Auth - Callbacks";
  }

  if (pathname.includes("/ok") || pathname.includes("/error")) {
    return "Auth - Meta";
  }

  if (pathname.startsWith("/")) {
    return "Auth";
  }

  return null;
}

function normalizeSchemaNode(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSchemaNode(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalizedEntries = Object.entries(value).map(([key, entryValue]) => [
    key,
    normalizeSchemaNode(entryValue),
  ]);
  const normalizedObject = Object.fromEntries(normalizedEntries) as Record<string, unknown>;

  if (Array.isArray(normalizedObject.type)) {
    const typeValues = normalizedObject.type.filter(
      (entry): entry is string => typeof entry === "string",
    );
    const nonNullTypes = typeValues.filter((entry) => entry !== "null");

    if (typeValues.includes("null") && nonNullTypes.length === 1) {
      normalizedObject.type = nonNullTypes[0];
      normalizedObject.nullable = true;
    } else if (nonNullTypes.length === 1) {
      normalizedObject.type = nonNullTypes[0];
    }
  }

  return normalizedObject;
}

function normalizeOpenApiDocument(document: OpenApiDocument) {
  const normalized = normalizeSchemaNode(document) as OpenApiDocument;
  const seenOperationIds = new Set<string>();

  for (const [path, pathItem] of Object.entries(normalized.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    const pathParameterNames = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    const pathItemObject = pathItem as Record<string, unknown>;

    for (const method of HTTP_METHODS) {
      const operation = pathItemObject[method];

      if (!operation || typeof operation !== "object") {
        continue;
      }

      const operationObject = operation as Record<string, unknown>;
      const parameters = Array.isArray(operationObject.parameters)
        ? [...operationObject.parameters]
        : [];

      for (const parameterName of pathParameterNames) {
        const hasParameter = parameters.some((parameter) => {
          if (!parameter || typeof parameter !== "object") {
            return false;
          }

          return (
            (parameter as { in?: unknown }).in === "path" &&
            (parameter as { name?: unknown }).name === parameterName
          );
        });

        if (!hasParameter) {
          parameters.push({
            name: parameterName,
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          });
        }
      }

      if (parameters.length > 0) {
        operationObject.parameters = parameters;
      }

      const authTag = getAuthTagName(path);

      if (authTag) {
        operationObject.tags = [authTag];
      }

      if (typeof operationObject.operationId === "string") {
        let operationId = operationObject.operationId;

        if (seenOperationIds.has(operationId)) {
          operationId = `${operationId}_${method}`;
        }

        seenOperationIds.add(operationId);
        operationObject.operationId = operationId;
      }
    }
  }

  return {
    ...normalized,
    openapi: "3.0.3",
    tags: mergeTags(normalized.tags, [
      { name: "Auth" },
      { name: "Auth - Access" },
      { name: "Auth - Accounts" },
      { name: "Auth - Callbacks" },
      { name: "Auth - Credentials" },
      { name: "Auth - Meta" },
      { name: "Auth - Sessions" },
    ]),
  };
}

function mergeTags(base: OpenApiDocument["tags"], auth: OpenApiDocument["tags"]) {
  const seen = new Set<string>();
  const tags = [...(base ?? []), ...(auth ?? [])].filter((tag) => {
    const key = tag?.name ?? "";

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return tags;
}

function filterUnusedTags(tags: OpenApiDocument["tags"], paths: OpenApiDocument["paths"]) {
  const usedTagNames = new Set<string>();

  for (const pathItem of Object.values(paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method];

      if (!operation || typeof operation !== "object") {
        continue;
      }

      for (const tag of ((operation as { tags?: unknown }).tags ?? []) as unknown[]) {
        if (typeof tag === "string" && tag.length > 0) {
          usedTagNames.add(tag);
        }
      }
    }
  }

  return (tags ?? []).filter((tag) => {
    const name = tag?.name;
    return typeof name === "string" && usedTagNames.has(name);
  });
}

function mergeComponents(base: OpenApiDocument["components"], auth: OpenApiDocument["components"]) {
  return {
    ...(base ?? {}),
    ...(auth ?? {}),
    schemas: {
      ...((base as { schemas?: Record<string, unknown> } | undefined)?.schemas ?? {}),
      ...((auth as { schemas?: Record<string, unknown> } | undefined)?.schemas ?? {}),
    },
    securitySchemes: {
      ...((base as { securitySchemes?: Record<string, unknown> } | undefined)?.securitySchemes ??
        {}),
      ...((auth as { securitySchemes?: Record<string, unknown> } | undefined)?.securitySchemes ??
        {}),
    },
  };
}

export function mergeOpenApiDocuments(
  baseDocument: OpenApiDocument,
  authDocument: OpenApiDocument | null,
) {
  if (!authDocument) {
    return {
      ...baseDocument,
      tags: filterUnusedTags(baseDocument.tags, baseDocument.paths),
    };
  }

  const authPaths = Object.fromEntries(
    Object.entries(authDocument.paths ?? {})
      .filter(([path]) => path !== "/open-api/generate-schema" && path !== "/reference")
      .map(([path, pathItem]) => [`${AUTH_BASE_PATH}${path}`, pathItem]),
  );

  const mergedPaths = {
    ...(baseDocument.paths ?? {}),
    ...authPaths,
  };

  return {
    ...baseDocument,
    tags: filterUnusedTags(mergeTags(baseDocument.tags, authDocument.tags), mergedPaths),
    paths: mergedPaths,
    components: mergeComponents(baseDocument.components, authDocument.components),
    security: authDocument.security ?? baseDocument.security,
  };
}

export async function loadAuthOpenApiDocument(app: FastifyInstance) {
  try {
    return normalizeOpenApiDocument(
      (await app.auth.api.generateOpenAPISchema()) as OpenApiDocument,
    );
  } catch (error) {
    app.log.warn({ err: error }, "Unable to load Better Auth OpenAPI schema.");

    return null;
  }
}
