import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildApp } from "./build-app";

type OpenApiDocument = {
  info?: {
    title?: string;
    description?: string;
  };
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
  paths?: Record<string, Record<string, OperationObject>>;
};

type SchemaObject = {
  $ref?: string;
  type?: string | string[];
  format?: string;
  enum?: unknown[];
  nullable?: boolean;
  anyOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  allOf?: SchemaObject[];
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  additionalProperties?: boolean | SchemaObject;
  example?: unknown;
  default?: unknown;
};

type OperationObject = {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Array<{
    name?: string;
    in?: string;
    required?: boolean;
    schema?: SchemaObject;
  }>;
  requestBody?: {
    content?: Record<
      string,
      {
        example?: unknown;
        examples?: Record<string, { value?: unknown }>;
        schema?: SchemaObject;
      }
    >;
  };
};

type PostmanItem = {
  name: string;
  item?: PostmanItem[];
  request?: {
    method: string;
    header: Array<{ key: string; value: string }>;
    body?: {
      mode: "raw";
      raw: string;
    };
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string; disabled?: boolean }>;
    };
  };
};

const API_BASE_URL = "http://localhost:3333";
const DEFAULT_FAKE_UUID = "11111111-1111-4111-8111-111111111111";

function fakeScalarValue(name?: string, schema?: SchemaObject) {
  if (schema?.example !== undefined) {
    return schema.example;
  }

  if (schema?.default !== undefined) {
    return schema.default;
  }

  if (schema?.enum?.length) {
    return schema.enum[0];
  }

  const lowerName = name?.toLowerCase() ?? "";
  const format = schema?.format;

  if (lowerName.includes("email") || format === "email") {
    return "postman@example.com";
  }

  if (lowerName.includes("password")) {
    return "12345678";
  }

  if (lowerName === "name" || lowerName.endsWith("name")) {
    return "Postman Example";
  }

  if (lowerName.includes("slug")) {
    return "postman-example";
  }

  if (lowerName.includes("title")) {
    return "Processo de teste";
  }

  if (lowerName.includes("description")) {
    return "Descricao de exemplo gerada automaticamente.";
  }

  if (lowerName.includes("token")) {
    return "token-de-exemplo";
  }

  if (lowerName.includes("callbackurl")) {
    return "http://localhost:5173/auth/callback";
  }

  if (lowerName.includes("image")) {
    return "https://placehold.co/128x128/png";
  }

  if (lowerName.includes("phone")) {
    return "+5585999999999";
  }

  if (lowerName.includes("status")) {
    return "draft";
  }

  if (format === "uuid" || lowerName === "id" || lowerName.endsWith("id")) {
    return DEFAULT_FAKE_UUID;
  }

  if (format === "date-time") {
    return "2026-01-01T12:00:00.000Z";
  }

  if (format === "uri") {
    return "https://example.com";
  }

  const type = Array.isArray(schema?.type)
    ? schema?.type.find((value) => value !== "null")
    : schema?.type;

  if (type === "boolean") {
    return true;
  }

  if (type === "integer" || type === "number") {
    return 1;
  }

  return "exemplo";
}

function resolveSchemaRef(schema: SchemaObject | undefined, document: OpenApiDocument) {
  if (!schema?.$ref) {
    return schema;
  }

  const refName = schema.$ref.split("/").pop();

  if (!refName) {
    return schema;
  }

  return document.components?.schemas?.[refName] ?? schema;
}

function fakeFromSchema(
  schema: SchemaObject | undefined,
  document: OpenApiDocument,
  fieldName?: string,
  seenRefs = new Set<string>(),
): unknown {
  const resolvedSchema = resolveSchemaRef(schema, document);

  if (!resolvedSchema) {
    return fakeScalarValue(fieldName);
  }

  if (resolvedSchema.$ref) {
    const refName = resolvedSchema.$ref.split("/").pop() ?? resolvedSchema.$ref;

    if (seenRefs.has(refName)) {
      return fakeScalarValue(fieldName, resolvedSchema);
    }

    const nextSeenRefs = new Set(seenRefs);
    nextSeenRefs.add(refName);

    return fakeFromSchema(
      resolveSchemaRef(resolvedSchema, document),
      document,
      fieldName,
      nextSeenRefs,
    );
  }

  if (resolvedSchema.example !== undefined) {
    return resolvedSchema.example;
  }

  if (resolvedSchema.default !== undefined) {
    return resolvedSchema.default;
  }

  if (resolvedSchema.anyOf?.length) {
    const candidate = resolvedSchema.anyOf.find((item) => {
      const itemType = Array.isArray(item.type) ? item.type : [item.type];
      return !itemType.includes("null");
    });
    return fakeFromSchema(candidate ?? resolvedSchema.anyOf[0], document, fieldName, seenRefs);
  }

  if (resolvedSchema.oneOf?.length) {
    return fakeFromSchema(resolvedSchema.oneOf[0], document, fieldName, seenRefs);
  }

  if (resolvedSchema.allOf?.length) {
    return Object.assign(
      {},
      ...resolvedSchema.allOf.map((item) => fakeFromSchema(item, document, fieldName, seenRefs)),
    );
  }

  const type = Array.isArray(resolvedSchema.type)
    ? resolvedSchema.type.find((value) => value !== "null")
    : resolvedSchema.type;

  if (type === "object" || resolvedSchema.properties) {
    const entries = Object.entries(resolvedSchema.properties ?? {}).map(([key, value]) => [
      key,
      fakeFromSchema(value, document, key, seenRefs),
    ]);

    if (entries.length > 0) {
      return Object.fromEntries(entries);
    }

    if (
      resolvedSchema.additionalProperties &&
      typeof resolvedSchema.additionalProperties === "object"
    ) {
      return {
        example: fakeFromSchema(
          resolvedSchema.additionalProperties,
          document,
          `${fieldName ?? "field"}Value`,
          seenRefs,
        ),
      };
    }

    return {};
  }

  if (type === "array") {
    return [fakeFromSchema(resolvedSchema.items, document, fieldName, seenRefs)];
  }

  return fakeScalarValue(fieldName, resolvedSchema);
}

function getAuthGroupName(pathname: string) {
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
    pathname.includes("/revoke-other-sessions")
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

  if (pathname.includes("/refresh-token")) {
    return "Auth - Sessions";
  }

  if (pathname.includes("/ok") || pathname.includes("/error")) {
    return "Auth - Meta";
  }

  if (pathname.startsWith("/api/auth/")) {
    return "Auth";
  }

  return null;
}

function getTagName(operation: OperationObject, pathname: string) {
  const authGroupName = getAuthGroupName(pathname);

  if (authGroupName) {
    return authGroupName;
  }

  if (operation.tags?.[0]) {
    return operation.tags[0];
  }

  return "Default";
}

function toPathSegments(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/\{([^}]+)\}/g, "{{$1}}"));
}

function toRawUrl(pathname: string) {
  return `{{baseUrl}}${pathname.replace(/\{([^}]+)\}/g, "{{$1}}")}`;
}

function getQueryParameters(operation: OperationObject, document: OpenApiDocument) {
  return (operation.parameters ?? [])
    .filter((parameter) => parameter.in === "query" && parameter.name)
    .map((parameter) => ({
      key: parameter.name as string,
      value: String(fakeFromSchema(parameter.schema, document, parameter.name) ?? ""),
      disabled: !parameter.required,
    }));
}

function getRequestBody(operation: OperationObject, document: OpenApiDocument) {
  const jsonContent = operation.requestBody?.content?.["application/json"];

  if (!jsonContent) {
    return undefined;
  }

  const example =
    jsonContent.example ??
    Object.values(jsonContent.examples ?? {}).find((candidate) => candidate.value)?.value ??
    fakeFromSchema(jsonContent.schema, document);

  return {
    mode: "raw" as const,
    raw: JSON.stringify(example, null, 2),
  };
}

function getItemName(method: string, pathname: string, operation: OperationObject) {
  return operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${pathname}`;
}

function createRequestItem(
  document: OpenApiDocument,
  pathname: string,
  method: string,
  operation: OperationObject,
): PostmanItem {
  const query = getQueryParameters(operation, document);
  const body = getRequestBody(operation, document);
  const headers = body
    ? [
        {
          key: "Content-Type",
          value: "application/json",
        },
      ]
    : [];

  return {
    name: getItemName(method, pathname, operation),
    request: {
      method: method.toUpperCase(),
      header: headers,
      ...(body ? { body } : {}),
      url: {
        raw: toRawUrl(pathname),
        host: ["{{baseUrl}}"],
        path: toPathSegments(pathname),
        ...(query.length > 0 ? { query } : {}),
      },
    },
  };
}

function buildCollection(document: OpenApiDocument) {
  const groups = new Map<string, PostmanItem[]>();

  for (const [pathname, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      const tag = getTagName(operation, pathname);
      const requestItem = createRequestItem(document, pathname, method, operation);
      const currentGroup = groups.get(tag) ?? [];

      currentGroup.push(requestItem);
      groups.set(tag, currentGroup);
    }
  }

  const items = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, item]) => ({
      name,
      item,
    }));

  return {
    info: {
      _postman_id: "d5873218-0ee3-4f4d-b64d-0dbd1c140f68",
      name: document.info?.title ?? "Licitadoc API",
      description:
        document.info?.description ??
        "Collection gerada automaticamente a partir do OpenAPI do backend.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
    variable: [
      {
        key: "baseUrl",
        value: API_BASE_URL,
      },
    ],
  };
}

function buildEnvironment() {
  const fakeValues = {
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
    processId: "33333333-3333-4333-8333-333333333333",
    documentId: "44444444-4444-4444-8444-444444444444",
    id: "provider-id-exemplo",
    token: "token-de-exemplo",
  };

  return {
    id: "0c7f2af2-f526-4d7d-9617-2c1306d934d8",
    name: "Licitadoc Local",
    values: [
      {
        key: "baseUrl",
        value: API_BASE_URL,
        enabled: true,
      },
      {
        key: "userId",
        value: fakeValues.userId,
        enabled: true,
      },
      {
        key: "organizationId",
        value: fakeValues.organizationId,
        enabled: true,
      },
      {
        key: "processId",
        value: fakeValues.processId,
        enabled: true,
      },
      {
        key: "documentId",
        value: fakeValues.documentId,
        enabled: true,
      },
      {
        key: "id",
        value: fakeValues.id,
        enabled: true,
      },
      {
        key: "token",
        value: fakeValues.token,
        enabled: true,
      },
    ],
    _postman_variable_scope: "environment",
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: "Codex",
  };
}

async function exportPostman() {
  const app = await buildApp();

  try {
    await app.ready();

    const document = (await app.getOpenApiDocument()) as OpenApiDocument;
    const collection = buildCollection(document);
    const environment = buildEnvironment();
    const outputDir = path.resolve(process.cwd(), "postman");
    const collectionFile = path.join(outputDir, "licitadoc.collection.json");
    const environmentFile = path.join(outputDir, "local.environment.json");

    await mkdir(outputDir, { recursive: true });
    await writeFile(collectionFile, JSON.stringify(collection, null, 2), "utf8");
    await writeFile(environmentFile, JSON.stringify(environment, null, 2), "utf8");

    app.log.info(`Postman collection written to ${collectionFile}`);
    app.log.info(`Postman environment written to ${environmentFile}`);
  } finally {
    await app.close();
  }
}

void exportPostman();
