const documentSchema = {
  type: "object",
  required: ["id", "name", "organizationId"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    organizationId: { type: "string" },
  },
} as const;

export const documentParamsSchema = {
  type: "object",
  required: ["documentId"],
  properties: {
    documentId: { type: "string" },
  },
} as const;

export const getDocumentsSchema = {
  tags: ["Documents"],
  summary: "List documents",
  response: {
    200: {
      type: "object",
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: documentSchema,
        },
      },
    },
  },
} as const;

export const getDocumentSchema = {
  tags: ["Documents"],
  summary: "Get document",
  params: documentParamsSchema,
  response: {
    200: documentSchema,
  },
} as const;
