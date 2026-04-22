import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_TEXT,
  OPENAPI_EXAMPLE_UUID,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";
import { supportedGeneratedDocumentTypes } from "../../shared/text-generation/types";

function normalizeNullableOptionalText(value?: string | null) {
  if (value == null) {
    return null;
  }

  const next = value.trim();

  return next ? next : null;
}

export const documentTypeSchema = z.enum(supportedGeneratedDocumentTypes).meta({
  example: "dfd",
});

export const documentStatusSchema = z.enum(["generating", "completed", "failed"]).meta({
  example: "completed",
});

const documentSummarySchema = z.object({
  id: openApiUuidSchema(),
  name: z.string(),
  organizationId: openApiUuidSchema(),
  processId: openApiUuidSchema(),
  type: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const documentDetailSchema = documentSummarySchema.extend({
  draftContent: z.string().nullable(),
  storageKey: z.string().nullable(),
  responsibles: z.array(z.string()),
});

export const documentParamsSchema = z.object({
  documentId: openApiUuidSchema(),
});

export const createDocumentBodySchema = withOpenApiExample(
  z
    .object({
      processId: openApiUuidSchema(),
      documentType: documentTypeSchema,
      instructions: withOpenApiExample(
        z.string().nullable().optional().transform(normalizeNullableOptionalText),
        OPENAPI_EXAMPLE_TEXT,
      ),
    })
    .strict(),
  {
    processId: OPENAPI_EXAMPLE_UUID,
    documentType: "dfd",
    instructions: "Priorizar linguagem objetiva para avaliacao preliminar.",
  },
);

export type CreateDocumentInput = z.output<typeof createDocumentBodySchema>;

export const createDocumentSchema = {
  tags: ["Documents"],
  summary: "Generate document draft",
  body: createDocumentBodySchema,
  response: {
    201: documentDetailSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const getDocumentsSchema = {
  tags: ["Documents"],
  summary: "List documents",
  response: {
    200: z.object({
      items: z.array(documentSummarySchema),
    }),
    ...pickErrorResponses(401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getDocumentSchema = {
  tags: ["Documents"],
  summary: "Get document",
  params: documentParamsSchema,
  response: {
    200: documentDetailSchema,
    ...pickErrorResponses(401, 403, 404, 500),
  },
} satisfies AppRouteSchema;
