const userSchema = {
  type: "object",
  required: ["id", "email", "role"],
  properties: {
    id: { type: "string" },
    email: { type: "string", format: "email" },
    role: {
      type: "string",
      enum: ["admin", "organization_owner", "member"],
    },
  },
} as const;

export const userParamsSchema = {
  type: "object",
  required: ["userId"],
  properties: {
    userId: { type: "string" },
  },
} as const;

export const getUsersSchema = {
  tags: ["Users"],
  summary: "List users",
  response: {
    200: {
      type: "object",
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: userSchema,
        },
      },
    },
  },
} as const;

export const getUserSchema = {
  tags: ["Users"],
  summary: "Get user by id",
  params: userParamsSchema,
  response: {
    200: userSchema,
  },
} as const;
