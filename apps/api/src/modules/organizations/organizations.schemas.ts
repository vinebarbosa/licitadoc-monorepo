const organizationSchema = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
} as const;

export const organizationParamsSchema = {
  type: "object",
  required: ["organizationId"],
  properties: {
    organizationId: { type: "string" },
  },
} as const;

export const getOrganizationSchema = {
  tags: ["Organizations"],
  summary: "Get organization",
  params: organizationParamsSchema,
  response: {
    200: organizationSchema,
  },
} as const;

export const updateOrganizationSchema = {
  tags: ["Organizations"],
  summary: "Update organization",
  params: organizationParamsSchema,
  response: {
    200: {
      type: "object",
      required: ["id", "updated"],
      properties: {
        id: { type: "string" },
        updated: { type: "boolean" },
      },
    },
  },
} as const;
