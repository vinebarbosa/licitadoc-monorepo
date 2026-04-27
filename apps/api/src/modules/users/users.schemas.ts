import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_EMAIL,
  OPENAPI_EXAMPLE_PERSON_NAME,
  OPENAPI_EXAMPLE_UUID,
  openApiEmailSchema,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";

const UPDATE_USER_ROLE_EXAMPLE = "member";
const updateUserBodyExample = {
  name: OPENAPI_EXAMPLE_PERSON_NAME,
  role: UPDATE_USER_ROLE_EXAMPLE,
  organizationId: OPENAPI_EXAMPLE_UUID,
};

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: openApiEmailSchema(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.enum(["admin", "organization_owner", "member"]),
  organizationId: openApiUuidSchema().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userParamsSchema = z.object({
  userId: z.string(),
});

export const usersPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: withOpenApiExample(z.string().trim().min(1).optional(), OPENAPI_EXAMPLE_EMAIL),
  role: withOpenApiExample(
    z.enum(["admin", "organization_owner", "member"]).optional(),
    UPDATE_USER_ROLE_EXAMPLE,
  ),
  organizationId: withOpenApiExample(openApiUuidSchema().optional(), OPENAPI_EXAMPLE_UUID),
});

export const updateUserBodySchema = withOpenApiExample(
  z
    .object({
      name: withOpenApiExample(z.string().min(1).optional(), OPENAPI_EXAMPLE_PERSON_NAME),
      role: withOpenApiExample(
        z.enum(["admin", "organization_owner", "member"]).optional(),
        UPDATE_USER_ROLE_EXAMPLE,
      ),
      organizationId: withOpenApiExample(
        openApiUuidSchema().nullable().optional(),
        OPENAPI_EXAMPLE_UUID,
      ),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided.",
    }),
  updateUserBodyExample,
);

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
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getUserSchema = {
  tags: ["Users"],
  summary: "Get user by id",
  params: userParamsSchema,
  response: {
    200: userSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const updateUserSchema = {
  tags: ["Users"],
  summary: "Update user",
  params: userParamsSchema,
  body: updateUserBodySchema,
  response: {
    200: userSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
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
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;
