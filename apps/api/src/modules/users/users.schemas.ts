import { type AppRouteSchema, z } from "../../shared/http/zod";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.enum(["admin", "organization_owner", "member"]),
  organizationId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userParamsSchema = z.object({
  userId: z.string(),
});

export const usersPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const updateUserBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(["admin", "organization_owner", "member"]).optional(),
    organizationId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

const paginatedUsersSchema = z.object({
  items: z.array(userSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const getUsersSchema = {
  tags: ["Users"],
  summary: "List users",
  querystring: usersPaginationQuerySchema,
  response: {
    200: paginatedUsersSchema,
  },
} satisfies AppRouteSchema;

export const getUserSchema = {
  tags: ["Users"],
  summary: "Get user by id",
  params: userParamsSchema,
  response: {
    200: userSchema,
  },
} satisfies AppRouteSchema;

export const updateUserSchema = {
  tags: ["Users"],
  summary: "Update user",
  params: userParamsSchema,
  body: updateUserBodySchema,
  response: {
    200: userSchema,
  },
} satisfies AppRouteSchema;

export const deleteUserSchema = {
  tags: ["Users"],
  summary: "Delete user",
  params: userParamsSchema,
  response: {
    200: z.object({
      success: z.literal(true),
    }),
  },
} satisfies AppRouteSchema;
