const processSchema = {
  type: "object",
  required: ["id", "title", "organizationId"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    organizationId: { type: "string" },
  },
} as const;

export const processParamsSchema = {
  type: "object",
  required: ["processId"],
  properties: {
    processId: { type: "string" },
  },
} as const;

export const getProcessesSchema = {
  tags: ["Processes"],
  summary: "List processes",
  response: {
    200: {
      type: "object",
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: processSchema,
        },
      },
    },
  },
} as const;

export const getProcessSchema = {
  tags: ["Processes"],
  summary: "Get process",
  params: processParamsSchema,
  response: {
    200: processSchema,
  },
} as const;
