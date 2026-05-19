import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_DATE_TIME,
  OPENAPI_EXAMPLE_PERSON_NAME,
  OPENAPI_EXAMPLE_TEXT,
  OPENAPI_EXAMPLE_UUID,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";

const supportTicketStatusSchema = z.enum(["open", "waiting", "resolved"]).meta({
  example: "open",
});
const supportTicketPrioritySchema = z.enum(["urgent", "high", "medium", "low"]).meta({
  example: "urgent",
});
const supportTicketSourceSchema = z.enum(["process", "document", "workspace"]).meta({
  example: "process",
});
const supportTicketMessageRoleSchema = z.enum(["user", "support", "system"]).meta({
  example: "user",
});
const supportTicketImageMimeTypeSchema = z.enum(["image/png", "image/jpeg", "image/webp"]).meta({
  example: "image/png",
});

const supportTicketAssigneeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const supportTicketRequesterSchema = z.object({
  name: z.string(),
  email: z.string(),
  organization: z.string().optional(),
});

const supportTicketContextSchema = z.object({
  screen: z.string(),
  route: z.string(),
  source: supportTicketSourceSchema,
  entityLabel: z.string().optional(),
});

const supportTicketAttachmentSchema = z.object({
  id: openApiUuidSchema(),
  type: z.enum(["screenshot", "image"]),
  name: z.string(),
  description: z.string(),
  messageId: openApiUuidSchema().optional(),
  mimeType: supportTicketImageMimeTypeSchema.optional(),
  sizeBytes: z.number().int().positive().optional(),
  url: z.string().optional(),
});

const supportTicketMessageSchema = z.object({
  id: openApiUuidSchema(),
  role: supportTicketMessageRoleSchema,
  authorName: z.string(),
  content: z.string(),
  timestamp: z.string(),
});

export const supportTicketSchema = z.object({
  id: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  protocol: z.string(),
  subject: z.string(),
  status: supportTicketStatusSchema,
  priority: supportTicketPrioritySchema,
  requester: supportTicketRequesterSchema,
  assignee: supportTicketAssigneeSchema.nullable(),
  context: supportTicketContextSchema,
  attachments: z.array(supportTicketAttachmentSchema),
  messages: z.array(supportTicketMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  firstResponseDueAt: z.string(),
  unreadCount: z.number().int().nonnegative(),
});

const supportTicketQueueCountsSchema = z.object({
  all: z.number().int().nonnegative(),
  open: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
  resolved: z.number().int().nonnegative(),
  attention: z.number().int().nonnegative(),
});

export const supportTicketParamsSchema = z.object({
  ticketId: openApiUuidSchema(),
});

export const supportTicketsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  status: supportTicketStatusSchema.optional(),
  priority: supportTicketPrioritySchema.optional(),
  source: supportTicketSourceSchema.optional(),
  assignee: z.enum(["all", "unassigned", "mine"]).optional(),
});

const nonEmptyTextSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: "Content is required.",
  });

const optionalTrimmedTextSchema = z
  .string()
  .transform((value) => value.trim())
  .optional();

const supportTicketAttachmentInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("screenshot"),
    name: z.string().min(1),
    description: z.string().min(1),
  }),
  z.object({
    type: z.literal("image"),
    name: z.string().min(1),
    description: z.string().min(1),
    storageKey: z.string().min(1),
    mimeType: supportTicketImageMimeTypeSchema,
    sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
  }),
]);

const supportTicketImageUploadBodySchema = withOpenApiExample(
  z
    .object({
      file: z.any().meta({
        description: "Support image file",
        format: "binary",
        isFile: true,
      }),
    })
    .strict(),
  {
    file: "(binary image file)",
  },
);

const supportTicketImageUploadResponseSchema = z.object({
  type: z.literal("image"),
  name: z.string(),
  description: z.string(),
  storageKey: z.string(),
  mimeType: supportTicketImageMimeTypeSchema,
  sizeBytes: z.number().int().positive(),
});

export const createSupportTicketBodySchema = withOpenApiExample(
  z
    .object({
      subject: withOpenApiExample(nonEmptyTextSchema, "Não consigo concluir a geração do DFD"),
      content: withOpenApiExample(
        nonEmptyTextSchema,
        "O documento fica carregando e não sai da etapa de geração.",
      ),
      context: supportTicketContextSchema,
      attachment: supportTicketAttachmentInputSchema.optional(),
      attachments: z.array(supportTicketAttachmentInputSchema).max(4).optional(),
    })
    .strict(),
  {
    subject: "Não consigo concluir a geração do DFD",
    content: "O documento fica carregando e não sai da etapa de geração.",
    context: {
      screen: "Detalhe do processo",
      route: "/app/processo/987",
      source: "process",
      entityLabel: "PE-2024/0142",
    },
    attachment: {
      type: "screenshot",
      name: "captura-de-tela.png",
      description: "Captura anexada a partir do widget de ajuda.",
    },
  },
);

export const createSupportTicketMessageBodySchema = withOpenApiExample(
  z
    .object({
      content: withOpenApiExample(optionalTrimmedTextSchema, OPENAPI_EXAMPLE_TEXT),
      attachments: z.array(supportTicketAttachmentInputSchema).max(4).optional(),
    })
    .strict(),
  {
    content: "Vou verificar isso agora e retorno por aqui.",
  },
).refine(
  (data) => Boolean(data.content?.trim()) || Boolean(data.attachments?.length),
  {
    message: "Content or attachment is required.",
  },
);

export const supportTicketImageAttachmentParamsSchema = z.object({
  ticketId: openApiUuidSchema(),
  attachmentId: openApiUuidSchema(),
});

export const updateSupportTicketBodySchema = withOpenApiExample(
  z
    .object({
      status: supportTicketStatusSchema.optional(),
      priority: supportTicketPrioritySchema.optional(),
      assigneeUserId: z.string().nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided.",
    }),
  {
    status: "waiting",
    priority: "high",
    assigneeUserId: "admin-current-user",
  },
);

export const publishSupportTicketTypingBodySchema = withOpenApiExample(
  z
    .object({
      isTyping: z.boolean(),
    })
    .strict(),
  {
    isTyping: true,
  },
);

export const supportRealtimeTokenBodySchema = withOpenApiExample(
  z
    .object({
      ticketId: openApiUuidSchema().optional(),
      organizationId: openApiUuidSchema().optional(),
    })
    .strict()
    .refine((data) => data.ticketId || data.organizationId, {
      message: "ticketId or organizationId is required.",
    }),
  {
    ticketId: OPENAPI_EXAMPLE_UUID,
    organizationId: OPENAPI_EXAMPLE_UUID,
  },
);

export type CreateSupportTicketInput = z.output<typeof createSupportTicketBodySchema>;
export type CreateSupportTicketMessageInput = z.output<typeof createSupportTicketMessageBodySchema>;
export type CreateSupportTicketAttachmentInput = z.output<typeof supportTicketAttachmentInputSchema>;
export type UpdateSupportTicketInput = z.output<typeof updateSupportTicketBodySchema>;
export type PublishSupportTicketTypingInput = z.output<typeof publishSupportTicketTypingBodySchema>;
export type SupportRealtimeTokenInput = z.output<typeof supportRealtimeTokenBodySchema>;

export const supportTicketMessageCreatedEventSchema = z.object({
  type: z.literal("ticket.message.created"),
  ticketId: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  message: supportTicketMessageSchema,
  ticket: supportTicketSchema,
  occurredAt: z.string().meta({ example: OPENAPI_EXAMPLE_DATE_TIME }),
});

export const supportTicketUpdatedEventSchema = z.object({
  type: z.literal("ticket.updated"),
  ticketId: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  ticket: supportTicketSchema,
  occurredAt: z.string().meta({ example: OPENAPI_EXAMPLE_DATE_TIME }),
});

export const supportTicketTypingEventSchema = z.object({
  type: z.literal("ticket.typing"),
  ticketId: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  actor: z.object({
    id: z.string(),
    name: z.string().meta({ example: OPENAPI_EXAMPLE_PERSON_NAME }),
  }),
  isTyping: z.boolean(),
  occurredAt: z.string().meta({ example: OPENAPI_EXAMPLE_DATE_TIME }),
});

export const supportTicketReadEventSchema = z.object({
  type: z.literal("ticket.read"),
  ticketId: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  actorId: z.string(),
  unreadCount: z.number().int().nonnegative(),
  occurredAt: z.string().meta({ example: OPENAPI_EXAMPLE_DATE_TIME }),
});

export const supportRealtimeTokenResponseSchema = z.object({
  provider: z.string(),
  realtimeEnabled: z.boolean(),
  channels: z.array(z.string()),
  tokenRequest: z.record(z.string(), z.unknown()).nullable(),
});

export const getSupportTicketsSchema = {
  tags: ["Support Tickets"],
  summary: "List support tickets",
  querystring: supportTicketsQuerySchema,
  response: {
    200: z.object({
      items: z.array(supportTicketSchema),
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      counts: supportTicketQueueCountsSchema,
    }),
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getMySupportTicketsSchema = {
  tags: ["Support Tickets"],
  summary: "List requester support tickets",
  querystring: supportTicketsQuerySchema,
  response: {
    200: z.object({
      items: z.array(supportTicketSchema),
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      counts: supportTicketQueueCountsSchema,
    }),
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const createSupportTicketSchema = {
  tags: ["Support Tickets"],
  summary: "Create support ticket",
  body: createSupportTicketBodySchema,
  response: {
    201: supportTicketSchema,
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const uploadSupportTicketImageSchema = {
  tags: ["Support Tickets"],
  summary: "Upload support ticket image",
  consumes: ["multipart/form-data"],
  body: supportTicketImageUploadBodySchema,
  response: {
    201: supportTicketImageUploadResponseSchema,
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getSupportTicketImageAttachmentSchema = {
  hide: true,
  params: supportTicketImageAttachmentParamsSchema,
} satisfies AppRouteSchema;

export const getSupportTicketSchema = {
  tags: ["Support Tickets"],
  summary: "Get support ticket",
  params: supportTicketParamsSchema,
  response: {
    200: supportTicketSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const createSupportTicketMessageSchema = {
  tags: ["Support Tickets"],
  summary: "Create support ticket message",
  params: supportTicketParamsSchema,
  body: createSupportTicketMessageBodySchema,
  response: {
    201: supportTicketSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const updateSupportTicketSchema = {
  tags: ["Support Tickets"],
  summary: "Update support ticket",
  params: supportTicketParamsSchema,
  body: updateSupportTicketBodySchema,
  response: {
    200: supportTicketSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const markSupportTicketReadSchema = {
  tags: ["Support Tickets"],
  summary: "Mark support ticket as read",
  params: supportTicketParamsSchema,
  response: {
    200: supportTicketSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const publishSupportTicketTypingSchema = {
  tags: ["Support Tickets"],
  summary: "Publish support ticket typing indicator",
  params: supportTicketParamsSchema,
  body: publishSupportTicketTypingBodySchema,
  response: {
    200: z.object({ ok: z.boolean() }),
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const createSupportRealtimeTokenSchema = {
  tags: ["Support Tickets"],
  summary: "Create support realtime token",
  body: supportRealtimeTokenBodySchema,
  response: {
    200: supportRealtimeTokenResponseSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;
