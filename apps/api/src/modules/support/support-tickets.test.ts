import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { describe, expect, it } from "vitest";
import type { Actor } from "../../authorization/actor";
import {
  organizations,
  supportTicketAttachments,
  supportTicketMessages,
  supportTicketReads,
  supportTickets,
  type users,
} from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import type { RealtimeProvider } from "../../shared/realtime/types";
import { createSupportRealtimeToken } from "./create-support-realtime-token";
import { createSupportTicket } from "./create-support-ticket";
import { createSupportTicketMessage } from "./create-support-ticket-message";
import { getSupportTicket } from "./get-support-ticket";
import { getSupportTickets } from "./get-support-tickets";
import { markSupportTicketRead } from "./mark-support-ticket-read";
import { updateSupportTicket } from "./update-support-ticket";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const OTHER_ORGANIZATION_ID = "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228";
const TICKET_ID = "11111111-e2e5-4876-b4c3-b35306c6e733";
const MESSAGE_ID = "22222222-e2e5-4876-b4c3-b35306c6e733";

type TestDb = FastifyInstance["db"] & {
  getAttachments(): Array<typeof supportTicketAttachments.$inferSelect>;
  getMessages(): Array<typeof supportTicketMessages.$inferSelect>;
  getReads(): Array<typeof supportTicketReads.$inferSelect>;
  getTicket(): typeof supportTickets.$inferSelect;
};

type PublishCall = Parameters<RealtimeProvider["publish"]>[0];

function createActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "admin-current-user",
    role: "admin",
    organizationId: null,
    onboardingStatus: "complete",
    ...overrides,
  };
}

function createUserRow(
  overrides: Partial<typeof users.$inferSelect> = {},
): typeof users.$inferSelect {
  return {
    id: "admin-current-user",
    name: "Admin LicitaDoc",
    email: "admin@licitadoc.test",
    emailVerified: true,
    image: null,
    role: "admin",
    organizationId: null,
    onboardingStatus: "complete",
    temporaryPasswordCreatedAt: null,
    temporaryPasswordExpiresAt: null,
    createdAt: new Date("2026-05-16T12:00:00.000Z"),
    updatedAt: new Date("2026-05-16T12:00:00.000Z"),
    ...overrides,
  };
}

function createTicketRow(
  overrides: Partial<typeof supportTickets.$inferSelect> = {},
): typeof supportTickets.$inferSelect {
  return {
    id: TICKET_ID,
    organizationId: ORGANIZATION_ID,
    protocol: "LD-SUP-1918",
    subject: "Nao consigo concluir a geracao do documento",
    status: "open",
    priority: "urgent",
    requesterUserId: "requester-user",
    requesterName: "Ana Martins",
    requesterEmail: "ana.martins@prefeitura.gov.br",
    requesterOrganization: "Prefeitura de Lajeado",
    assigneeUserId: null,
    contextScreen: "Detalhe do processo",
    contextRoute: "/app/processo/987",
    contextSource: "process",
    contextEntityLabel: "Processo de aquisicao de notebooks",
    firstResponseDueAt: new Date("2026-05-16T12:16:00.000Z"),
    createdAt: new Date("2026-05-16T12:08:00.000Z"),
    updatedAt: new Date("2026-05-16T12:08:00.000Z"),
    ...overrides,
  };
}

function createMessageRow(
  overrides: Partial<typeof supportTicketMessages.$inferSelect> = {},
): typeof supportTicketMessages.$inferSelect {
  return {
    id: MESSAGE_ID,
    ticketId: TICKET_ID,
    organizationId: ORGANIZATION_ID,
    authorUserId: "requester-user",
    role: "user",
    authorName: "Ana Martins",
    content: "O processo fica carregando.",
    createdAt: new Date("2026-05-16T12:08:00.000Z"),
    ...overrides,
  };
}

function createOrganizationRow(
  overrides: Partial<typeof organizations.$inferSelect> = {},
): typeof organizations.$inferSelect {
  return {
    id: ORGANIZATION_ID,
    name: "Prefeitura de Lajeado",
    slug: "prefeitura-de-lajeado",
    officialName: "Prefeitura Municipal de Lajeado",
    cnpj: "00.000.000/0001-00",
    city: "Lajeado",
    state: "RS",
    address: "Rua Central, 100",
    zipCode: "95900-000",
    phone: "5133330000",
    institutionalEmail: "contato@lajeado.gov.br",
    website: null,
    logoUrl: null,
    authorityName: "Ana Martins",
    authorityRole: "Prefeita",
    isActive: true,
    createdByUserId: "requester-user",
    createdAt: new Date("2026-05-16T12:00:00.000Z"),
    updatedAt: new Date("2026-05-16T12:00:00.000Z"),
    ...overrides,
  };
}

function createDb({
  ticket = createTicketRow(),
  messages = [createMessageRow()],
  attachments = [],
  reads = [],
  organization = createOrganizationRow(),
  userRows = [createUserRow(), createUserRow({ id: "requester-user", role: "member" })],
  ticketRows,
  countResults = [],
}: {
  ticket?: typeof supportTickets.$inferSelect;
  messages?: Array<typeof supportTicketMessages.$inferSelect>;
  attachments?: Array<typeof supportTicketAttachments.$inferSelect>;
  reads?: Array<typeof supportTicketReads.$inferSelect>;
  organization?: typeof organizations.$inferSelect | null;
  userRows?: Array<typeof users.$inferSelect>;
  ticketRows?: Array<typeof supportTickets.$inferSelect>;
  countResults?: number[];
} = {}) {
  let currentTicket = ticket;
  const currentTicketRows = ticketRows ? [...ticketRows] : null;
  const currentMessages = [...messages];
  const currentAttachments = [...attachments];
  let currentReads = [...reads];
  const currentCountResults = [...countResults];

  const db = {
    select: () => ({
      from: () => ({
        where: async () => [
          {
            total:
              currentCountResults.length > 0
                ? currentCountResults.shift()
                : (currentTicketRows ?? [currentTicket]).length,
          },
        ],
      }),
    }),
    query: {
      organizations: {
        findFirst: async () => organization,
      },
      supportTickets: {
        findFirst: async () => currentTicket,
        findMany: async () => currentTicketRows ?? [currentTicket],
      },
      supportTicketMessages: {
        findMany: async () => currentMessages,
      },
      supportTicketAttachments: {
        findMany: async () => currentAttachments,
      },
      supportTicketReads: {
        findMany: async () => currentReads,
      },
      users: {
        findFirst: async () => userRows[0] ?? null,
        findMany: async () => userRows.map((user) => ({ id: user.id, name: user.name })),
      },
    },
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        if (table === supportTickets) {
          currentTicket = createTicketRow({
            id: "44444444-e2e5-4876-b4c3-b35306c6e733",
            organizationId: String(values.organizationId),
            protocol: String(values.protocol),
            subject: String(values.subject),
            status: String(values.status),
            priority: String(values.priority),
            requesterUserId: values.requesterUserId ? String(values.requesterUserId) : null,
            requesterName: String(values.requesterName),
            requesterEmail: String(values.requesterEmail),
            requesterOrganization: values.requesterOrganization
              ? String(values.requesterOrganization)
              : null,
            assigneeUserId: values.assigneeUserId ? String(values.assigneeUserId) : null,
            contextScreen: String(values.contextScreen),
            contextRoute: String(values.contextRoute),
            contextSource: String(values.contextSource),
            contextEntityLabel: values.contextEntityLabel
              ? String(values.contextEntityLabel)
              : null,
            firstResponseDueAt: values.firstResponseDueAt as Date,
            createdAt: new Date("2026-05-16T12:10:00.000Z"),
            updatedAt: new Date("2026-05-16T12:10:00.000Z"),
          });

          return {
            returning: async () => [currentTicket],
          };
        }

        if (table === supportTicketMessages) {
          const message = createMessageRow({
            id: "33333333-e2e5-4876-b4c3-b35306c6e733",
            ticketId: String(values.ticketId),
            organizationId: String(values.organizationId),
            authorUserId: values.authorUserId ? String(values.authorUserId) : null,
            role: String(values.role),
            authorName: String(values.authorName),
            content: String(values.content),
            createdAt: new Date("2026-05-16T12:10:00.000Z"),
          });
          currentMessages.push(message);

          return {
            returning: async () => [message],
          };
        }

        if (table === supportTicketAttachments) {
          const attachment = {
            id: "55555555-e2e5-4876-b4c3-b35306c6e733",
            ticketId: String(values.ticketId),
            messageId: values.messageId ? String(values.messageId) : null,
            type: String(values.type),
            name: String(values.name),
            description: String(values.description),
            storageKey: values.storageKey ? String(values.storageKey) : null,
            mimeType: values.mimeType ? String(values.mimeType) : null,
            sizeBytes: typeof values.sizeBytes === "number" ? values.sizeBytes : null,
            createdAt: new Date("2026-05-16T12:10:00.000Z"),
          };
          currentAttachments.push(attachment);

          return {
            returning: async () => [attachment],
          };
        }

        assert.equal(table, supportTicketReads);
        const read = {
          ticketId: String(values.ticketId),
          userId: String(values.userId),
          readAt: values.readAt as Date,
        };
        currentReads.push(read);

        return {
          returning: async () => [read],
        };
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            if (table === supportTickets) {
              currentTicket = {
                ...currentTicket,
                ...values,
              };
              return [currentTicket];
            }

            assert.equal(table, supportTicketReads);
            const currentRead = currentReads[0];
            if (!currentRead) {
              return [];
            }

            currentReads = [
              {
                ...currentRead,
                readAt: values.readAt as Date,
              },
            ];
            return currentReads;
          },
        }),
      }),
    }),
    transaction: async (callback: (tx: unknown) => unknown) => callback(db),
    getAttachments: () => currentAttachments,
    getMessages: () => currentMessages,
    getReads: () => currentReads,
    getTicket: () => currentTicket,
  } as unknown as TestDb;

  return db;
}

function createRealtimeProvider({ failPublish = false }: { failPublish?: boolean } = {}) {
  const publishCalls: PublishCall[] = [];
  const provider: RealtimeProvider & { publishCalls: PublishCall[] } = {
    providerKey: "test",
    isEnabled: true,
    publishCalls,
    async publish(input) {
      publishCalls.push(input);

      if (failPublish) {
        throw new Error("publish failed");
      }
    },
    async createTokenRequest(input) {
      return {
        provider: "test",
        realtimeEnabled: true,
        tokenRequest: {
          clientId: input.clientId,
          capability: input.capability,
        },
      };
    },
  };

  return provider;
}

describe("support ticket messaging", () => {
  it("returns queue counts that ignore only the selected status filter", async () => {
    const db = createDb({
      ticket: createTicketRow({ status: "resolved" }),
      countResults: [1, 2, 1, 1, 3],
    });

    const result = await getSupportTickets({
      actor: createActor(),
      db,
      status: "resolved",
      page: 1,
      pageSize: 20,
      now: new Date("2026-05-16T12:13:00.000Z"),
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe("resolved");
    expect(result.total).toBe(1);
    expect(result.counts).toEqual({
      all: 4,
      open: 2,
      waiting: 1,
      resolved: 1,
      attention: 3,
    });
  });

  it("creates a requester support ticket with first message and attachment metadata", async () => {
    const db = createDb({
      messages: [],
      userRows: [
        createUserRow({
          id: "requester-user",
          name: "Ana Martins",
          email: "ana.martins@prefeitura.gov.br",
          role: "member",
          organizationId: ORGANIZATION_ID,
        }),
      ],
    });
    const realtime = createRealtimeProvider();
    const ticket = await createSupportTicket({
      actor: createActor({
        id: "requester-user",
        role: "member",
        organizationId: ORGANIZATION_ID,
      }),
      db,
      realtime,
      input: {
        subject: "Nao consigo concluir a geracao do documento",
        content: "O processo fica carregando.",
        context: {
          screen: "Detalhe do processo",
          route: "/app/processo/987",
          source: "process",
          entityLabel: "Processo de aquisicao de notebooks",
        },
        attachment: {
          type: "screenshot",
          name: "captura-de-tela.png",
          description: "Captura anexada a partir do widget de ajuda.",
        },
      },
    });

    expect(ticket.subject).toBe("Nao consigo concluir a geracao do documento");
    expect(ticket.requester.name).toBe("Ana Martins");
    expect(ticket.requester.organization).toBe("Prefeitura Municipal de Lajeado");
    expect(ticket.context.route).toBe("/app/processo/987");
    expect(ticket.messages).toHaveLength(1);
    expect(ticket.messages[0]?.content).toBe("O processo fica carregando.");
    expect(ticket.attachments).toHaveLength(1);
    expect(ticket.attachments[0]?.messageId).toBe(ticket.messages[0]?.id);
    expect(db.getMessages()).toHaveLength(1);
    expect(db.getAttachments()).toHaveLength(1);
    expect(realtime.publishCalls.map((call) => call.channel)).toEqual([
      `private:ticket:${ticket.id}`,
      `private:org:${ORGANIZATION_ID}:support-tickets`,
    ]);
  });

  it("creates a requester support ticket with uploaded image attachment metadata", async () => {
    const db = createDb({
      messages: [],
      userRows: [
        createUserRow({
          id: "requester-user",
          name: "Ana Martins",
          email: "ana.martins@prefeitura.gov.br",
          role: "member",
          organizationId: ORGANIZATION_ID,
        }),
      ],
    });
    const ticket = await createSupportTicket({
      actor: createActor({
        id: "requester-user",
        role: "member",
        organizationId: ORGANIZATION_ID,
      }),
      db,
      realtime: createRealtimeProvider(),
      input: {
        subject: "Erro na tela",
        content: "Apareceu um erro ao gerar o documento.",
        context: {
          screen: "Detalhe do processo",
          route: "/app/processo/987",
          source: "process",
        },
        attachments: [
          {
            type: "image",
            name: "erro.png",
            description: "Captura com mensagem de erro.",
            storageKey: "support-ticket-images/requester-user/2026/05/erro.png",
            mimeType: "image/png",
            sizeBytes: 2048,
          },
        ],
      },
    });

    expect(ticket.attachments).toHaveLength(1);
    expect(ticket.attachments[0]).toMatchObject({
      type: "image",
      name: "erro.png",
      description: "Captura com mensagem de erro.",
      mimeType: "image/png",
      sizeBytes: 2048,
      messageId: ticket.messages[0]?.id,
    });
    const imageAttachment = ticket.attachments[0];
    if (!imageAttachment || !("url" in imageAttachment)) {
      throw new Error("Expected created ticket to include an image attachment URL.");
    }
    expect(imageAttachment.url).toContain(`/api/support-tickets/${ticket.id}/attachments/`);
    expect(db.getAttachments()[0]?.storageKey).toBe(
      "support-ticket-images/requester-user/2026/05/erro.png",
    );
  });

  it("rejects requester ticket creation without an organization", async () => {
    const db = createDb({ messages: [] });

    await expect(
      createSupportTicket({
        actor: createActor({
          id: "requester-user",
          role: "member",
          organizationId: null,
        }),
        db,
        realtime: createRealtimeProvider(),
        input: {
          subject: "Preciso de ajuda",
          content: "Nao consigo continuar.",
          context: {
            screen: "Central",
            route: "/app",
            source: "workspace",
          },
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(db.getMessages()).toHaveLength(0);
  });

  it("persists a message before publishing realtime events", async () => {
    const db = createDb();
    const realtime = createRealtimeProvider();
    const ticket = await createSupportTicketMessage({
      actor: createActor(),
      db,
      realtime,
      ticketId: TICKET_ID,
      input: { content: "Vou revisar a geracao agora." },
    });

    expect(ticket.messages.at(-1)?.content).toBe("Vou revisar a geracao agora.");
    expect(db.getMessages()).toHaveLength(2);
    expect(realtime.publishCalls.length).toBeGreaterThan(0);
    expect(realtime.publishCalls[0]?.name).toBe("ticket.message.created");
  });

  it("persists attachment-only image messages", async () => {
    const db = createDb();
    const ticket = await createSupportTicketMessage({
      actor: createActor({
        id: "requester-user",
        role: "member",
        organizationId: ORGANIZATION_ID,
      }),
      db,
      realtime: createRealtimeProvider(),
      ticketId: TICKET_ID,
      input: {
        attachments: [
          {
            type: "image",
            name: "tela-atual.webp",
            description: "Imagem anexada na conversa de suporte.",
            storageKey: "support-ticket-images/requester-user/2026/05/tela-atual.webp",
            mimeType: "image/webp",
            sizeBytes: 4096,
          },
        ],
      },
    });

    expect(ticket.messages.at(-1)?.content).toBe("Imagem anexada");
    expect(ticket.attachments.at(-1)).toMatchObject({
      type: "image",
      name: "tela-atual.webp",
      mimeType: "image/webp",
      sizeBytes: 4096,
      messageId: ticket.messages.at(-1)?.id,
    });
    expect(db.getAttachments()).toHaveLength(1);
  });

  it("rejects image attachment storage keys from another user", async () => {
    const db = createDb();

    await expect(
      createSupportTicketMessage({
        actor: createActor({
          id: "requester-user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        }),
        db,
        realtime: createRealtimeProvider(),
        ticketId: TICKET_ID,
        input: {
          attachments: [
            {
              type: "image",
              name: "outra-chave.png",
              description: "Imagem com chave indevida.",
              storageKey: "support-ticket-images/other-user/2026/05/outra-chave.png",
              mimeType: "image/png",
              sizeBytes: 1024,
            },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(db.getAttachments()).toHaveLength(0);
  });

  it("keeps persisted messages available when realtime publish fails", async () => {
    const db = createDb();
    const ticket = await createSupportTicketMessage({
      actor: createActor(),
      db,
      realtime: createRealtimeProvider({ failPublish: true }),
      ticketId: TICKET_ID,
      input: { content: "Mensagem persistida mesmo sem realtime." },
    });

    expect(ticket.messages.at(-1)?.content).toBe("Mensagem persistida mesmo sem realtime.");
    expect(db.getMessages()).toHaveLength(2);
  });

  it("rejects non-admin ticket metadata updates", async () => {
    const db = createDb();

    await expect(
      updateSupportTicket({
        actor: createActor({
          id: "requester-user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        }),
        db,
        realtime: createRealtimeProvider(),
        ticketId: TICKET_ID,
        input: { status: "resolved" },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("creates scoped realtime tokens only for accessible channels", async () => {
    const db = createDb();
    const token = await createSupportRealtimeToken({
      actor: createActor(),
      db,
      realtime: createRealtimeProvider(),
      tokenTtlMs: 60_000,
      input: {
        ticketId: TICKET_ID,
        organizationId: ORGANIZATION_ID,
      },
    });

    expect(token.realtimeEnabled).toBe(true);
    expect(token.channels).toEqual([
      `private:ticket:${TICKET_ID}`,
      `private:org:${ORGANIZATION_ID}:support-tickets`,
    ]);

    const requesterToken = await createSupportRealtimeToken({
      actor: createActor({
        id: "requester-user",
        role: "member",
        organizationId: ORGANIZATION_ID,
      }),
      db,
      realtime: createRealtimeProvider(),
      tokenTtlMs: 60_000,
      input: {
        ticketId: TICKET_ID,
      },
    });

    expect(requesterToken.channels).toEqual([`private:ticket:${TICKET_ID}`]);

    await expect(
      createSupportRealtimeToken({
        actor: createActor({
          id: "requester-user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        }),
        db,
        realtime: createRealtimeProvider(),
        tokenTtlMs: 60_000,
        input: {
          ticketId: TICKET_ID,
          organizationId: ORGANIZATION_ID,
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      createSupportRealtimeToken({
        actor: createActor({
          id: "other-user",
          role: "member",
          organizationId: OTHER_ORGANIZATION_ID,
        }),
        db,
        realtime: createRealtimeProvider(),
        tokenTtlMs: 60_000,
        input: { ticketId: TICKET_ID },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects organization peer access to another requester's ticket", async () => {
    const db = createDb();

    await expect(
      getSupportTicket({
        actor: createActor({
          id: "other-user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        }),
        db,
        ticketId: TICKET_ID,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("updates read state and returns a reconciled unread count", async () => {
    const actor = createActor();
    const db = createDb();

    expect((await getSupportTicket({ actor, db, ticketId: TICKET_ID })).unreadCount).toBe(1);

    const ticket = await markSupportTicketRead({
      actor,
      db,
      realtime: createRealtimeProvider(),
      ticketId: TICKET_ID,
    });

    expect(ticket.unreadCount).toBe(0);
    expect(db.getReads()).toHaveLength(1);
  });
});
