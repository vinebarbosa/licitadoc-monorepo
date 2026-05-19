import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_EMAIL,
  OPENAPI_EXAMPLE_UUID,
  openApiEmailSchema,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";

const inviteRoleSchema = z.enum(["organization_owner", "member"]);
const inviteStatusSchema = z.enum(["pending", "accepted", "revoked"]);

const inviteSchema = z.object({
  id: openApiUuidSchema(),
  email: openApiEmailSchema(),
  role: inviteRoleSchema,
  organizationId: openApiUuidSchema().nullable(),
  invitedByUserId: z.string().nullable(),
  provisionedUserId: z.string().nullable(),
  acceptedByUserId: z.string().nullable(),
  status: inviteStatusSchema,
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const inviteWithTokenSchema = inviteSchema.extend({
  token: z.string(),
  inviteUrl: z.string(),
});

const invitePreviewSchema = z.object({
  id: openApiUuidSchema(),
  email: openApiEmailSchema(),
  role: inviteRoleSchema,
  organizationId: openApiUuidSchema().nullable(),
  status: inviteStatusSchema,
  expiresAt: z.string(),
  isExpired: z.boolean(),
});

export const invitePaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const createInviteBodyExample = {
  email: OPENAPI_EXAMPLE_EMAIL,
  organizationId: OPENAPI_EXAMPLE_UUID,
};

const paginatedInvitesSchema = z.object({
  items: z.array(inviteSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const createInviteBodySchema = withOpenApiExample(
  z.object({
    email: openApiEmailSchema(),
    organizationId: openApiUuidSchema().nullable().optional(),
  }),
  createInviteBodyExample,
);

export const inviteTokenParamsSchema = z.object({
  inviteToken: z.string().min(1),
});

export const createInviteSchema = {
  tags: ["Invites"],
  summary: "Create invite",
  body: createInviteBodySchema,
  response: {
    201: inviteWithTokenSchema,
    ...pickErrorResponses(400, 401, 403, 409, 500),
  },
} satisfies AppRouteSchema;

export const getInvitesSchema = {
  tags: ["Invites"],
  summary: "List invites",
  querystring: invitePaginationQuerySchema,
  response: {
    200: paginatedInvitesSchema,
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getInviteByTokenSchema = {
  tags: ["Invites"],
  summary: "Preview invite by token",
  params: inviteTokenParamsSchema,
  response: {
    200: invitePreviewSchema,
    ...pickErrorResponses(400, 404, 500),
  },
} satisfies AppRouteSchema;

export const acceptInviteSchema = {
  tags: ["Invites"],
  summary: "Accept invite",
  params: inviteTokenParamsSchema,
  response: {
    200: inviteSchema,
    ...pickErrorResponses(400, 401, 404, 500),
  },
} satisfies AppRouteSchema;
