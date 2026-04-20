import { type AppRouteSchema, z } from "../../shared/http/zod";

const inviteRoleSchema = z.enum(["organization_owner", "member"]);
const inviteStatusSchema = z.enum(["pending", "accepted", "revoked"]);

const inviteSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: inviteRoleSchema,
  organizationId: z.string().uuid().nullable(),
  invitedByUserId: z.string().nullable(),
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
  id: z.string().uuid(),
  email: z.string().email(),
  role: inviteRoleSchema,
  organizationId: z.string().uuid().nullable(),
  status: inviteStatusSchema,
  expiresAt: z.string(),
  isExpired: z.boolean(),
});

export const invitePaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const paginatedInvitesSchema = z.object({
  items: z.array(inviteSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const createInviteBodySchema = z.object({
  email: z.email(),
  organizationId: z.uuid().nullable().optional(),
});

export const inviteTokenParamsSchema = z.object({
  inviteToken: z.string().min(1),
});

export const createInviteSchema = {
  tags: ["Invites"],
  summary: "Create invite",
  body: createInviteBodySchema,
  response: {
    201: inviteWithTokenSchema,
  },
} satisfies AppRouteSchema;

export const getInvitesSchema = {
  tags: ["Invites"],
  summary: "List invites",
  querystring: invitePaginationQuerySchema,
  response: {
    200: paginatedInvitesSchema,
  },
} satisfies AppRouteSchema;

export const getInviteByTokenSchema = {
  tags: ["Invites"],
  summary: "Preview invite by token",
  params: inviteTokenParamsSchema,
  response: {
    200: invitePreviewSchema,
  },
} satisfies AppRouteSchema;

export const acceptInviteSchema = {
  tags: ["Invites"],
  summary: "Accept invite",
  params: inviteTokenParamsSchema,
  response: {
    200: inviteSchema,
  },
} satisfies AppRouteSchema;
