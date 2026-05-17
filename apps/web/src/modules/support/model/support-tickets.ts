export type SupportTicketStatus = "open" | "waiting" | "resolved";

export type SupportTicketPriority = "urgent" | "high" | "medium" | "low";

export type SupportTicketSource = "process" | "document" | "workspace";

export type SupportTicketMessageRole = "user" | "support" | "system";

export type SupportTicketAssignee = {
  id: string;
  name: string;
};

export type SupportTicketRequester = {
  name: string;
  email: string;
  organization?: string;
};

export type SupportTicketAttachment = {
  id: string;
  type: "screenshot" | "image";
  name: string;
  description: string;
  messageId?: string;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
  sizeBytes?: number;
  url?: string;
};

export type PendingSupportTicketImageAttachment = {
  type: "image";
  name: string;
  description: string;
  storageKey: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  sizeBytes: number;
};

export type SupportTicketMessage = {
  id: string;
  role: SupportTicketMessageRole;
  authorName: string;
  content: string;
  timestamp: string;
};

export type SupportTicketContext = {
  screen: string;
  route: string;
  source: SupportTicketSource;
  entityLabel?: string;
};

export type SupportTicket = {
  id: string;
  organizationId: string;
  protocol: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  requester: SupportTicketRequester;
  assignee: SupportTicketAssignee | null;
  context: SupportTicketContext;
  attachments: SupportTicketAttachment[];
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
  firstResponseDueAt: string;
  unreadCount: number;
};

export type SupportTicketFilters = {
  search: string;
  status: SupportTicketStatus | "all";
  priority: SupportTicketPriority | "all";
  assignee: "all" | "unassigned" | "mine";
  source: SupportTicketSource | "all";
};

export type SupportTicketQueueCounts = {
  all: number;
  open: number;
  waiting: number;
  resolved: number;
  attention: number;
};

export type SupportQueueTimeDisplay = {
  label: string;
  title: string;
  ariaLabel: string;
};

export type SupportMessageTimelineItem =
  | {
      type: "day";
      id: string;
      label: string;
    }
  | {
      type: "message";
      id: string;
      message: SupportTicketMessage;
      timeLabel: string;
      timestampTitle: string;
      dayLabel: string;
    };

export type SupportAgent = {
  id: string;
  name: string;
};

export const SUPPORT_NOW = "2026-05-16T12:30:00-03:00";

export const DEFAULT_SUPPORT_AGENT: SupportAgent = {
  id: "admin-current-user",
  name: "Admin LicitaDoc",
};

export const defaultSupportTicketFilters: SupportTicketFilters = {
  search: "",
  status: "all",
  priority: "all",
  assignee: "all",
  source: "all",
};

export const SUPPORT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SUPPORT_IMAGE_MAX_COUNT = 4;
export const SUPPORT_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

export function isAcceptedSupportImage(file: File) {
  return file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp";
}

export function formatSupportFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function getSupportAttachmentImageUrl(attachment: SupportTicketAttachment) {
  if (!attachment.url) {
    return undefined;
  }

  return attachment.url.startsWith("/")
    ? `http://localhost:3333${attachment.url}`
    : attachment.url;
}

export const supportStatusConfig: Record<
  SupportTicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Aberto",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  waiting: {
    label: "Aguardando usuário",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  resolved: {
    label: "Resolvido",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export const supportPriorityConfig: Record<
  SupportTicketPriority,
  { label: string; className: string }
> = {
  urgent: {
    label: "Urgente",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  high: {
    label: "Alta",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  medium: {
    label: "Media",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  low: {
    label: "Baixa",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
};

export const supportSourceConfig: Record<SupportTicketSource, { label: string }> = {
  process: { label: "Processo" },
  document: { label: "Documento" },
  workspace: { label: "Central" },
};

export const seededSupportTickets: SupportTicket[] = [
  {
    id: "ticket-process-generation",
    organizationId: "organization-1",
    protocol: "LD-SUP-1918",
    subject: "Nao consigo concluir a geracao do documento",
    status: "open",
    priority: "urgent",
    requester: {
      name: "Ana Martins",
      email: "ana.martins@prefeitura.gov.br",
      organization: "Prefeitura de Lajeado",
    },
    assignee: null,
    context: {
      screen: "Detalhe do processo",
      route: "/app/processo/987ed5cb-456d-4bb3-96d5-435da87e6a98",
      source: "process",
      entityLabel: "Processo de aquisicao de notebooks",
    },
    attachments: [
      {
        id: "attachment-process-screen",
        type: "image",
        name: "captura-detalhe-processo.png",
        description: "Captura enviada pelo usuario mostrando a etapa de geracao travada.",
        messageId: "message-process-user-1",
        mimeType: "image/png",
        sizeBytes: 2048,
        url: "/api/support-tickets/ticket-process-generation/attachments/attachment-process-screen/image",
      },
    ],
    messages: [
      {
        id: "message-process-user-1",
        role: "user",
        authorName: "Ana Martins",
        content: "Tentei gerar o DFD, mas o processo fica carregando e nao sai dessa tela.",
        timestamp: "2026-05-16T12:08:00-03:00",
      },
      {
        id: "message-process-system-1",
        role: "system",
        authorName: "LicitaDoc",
        content: "Captura de tela anexada pelo usuario.",
        timestamp: "2026-05-16T12:08:10-03:00",
      },
    ],
    createdAt: "2026-05-16T12:08:00-03:00",
    updatedAt: "2026-05-16T12:18:00-03:00",
    firstResponseDueAt: "2026-05-16T12:16:00-03:00",
    unreadCount: 2,
  },
  {
    id: "ticket-document-preview",
    organizationId: "organization-1",
    protocol: "LD-SUP-1907",
    subject: "Preview do documento nao abre",
    status: "open",
    priority: "high",
    requester: {
      name: "Roberto Lima",
      email: "roberto.lima@prefeitura.gov.br",
      organization: "Prefeitura de Boa Vista",
    },
    assignee: DEFAULT_SUPPORT_AGENT,
    context: {
      screen: "Documentos",
      route: "/app/documento/doc-122/preview",
      source: "document",
      entityLabel: "ETP - Contratacao de limpeza",
    },
    attachments: [],
    messages: [
      {
        id: "message-document-user-1",
        role: "user",
        authorName: "Roberto Lima",
        content: "Ao clicar para abrir a previa, nada acontece. Preciso revisar antes de enviar.",
        timestamp: "2026-05-16T11:55:00-03:00",
      },
      {
        id: "message-document-support-1",
        role: "support",
        authorName: "Admin LicitaDoc",
        content: "Vou verificar o documento e te retorno por aqui.",
        timestamp: "2026-05-16T12:02:00-03:00",
      },
    ],
    createdAt: "2026-05-16T11:55:00-03:00",
    updatedAt: "2026-05-16T12:02:00-03:00",
    firstResponseDueAt: "2026-05-16T12:03:00-03:00",
    unreadCount: 0,
  },
  {
    id: "ticket-workspace-members",
    organizationId: "organization-1",
    protocol: "LD-SUP-1884",
    subject: "Como convidar um membro para a equipe",
    status: "waiting",
    priority: "medium",
    requester: {
      name: "Carla Souza",
      email: "carla.souza@prefeitura.gov.br",
      organization: "Prefeitura de Santa Rita",
    },
    assignee: DEFAULT_SUPPORT_AGENT,
    context: {
      screen: "Central de Trabalho",
      route: "/app",
      source: "workspace",
    },
    attachments: [],
    messages: [
      {
        id: "message-workspace-user-1",
        role: "user",
        authorName: "Carla Souza",
        content:
          "Preciso adicionar outra pessoa da minha equipe, mas nao encontrei onde fazer isso.",
        timestamp: "2026-05-16T10:42:00-03:00",
      },
      {
        id: "message-workspace-support-1",
        role: "support",
        authorName: "Admin LicitaDoc",
        content:
          "Voce pode abrir o menu Membros se tiver perfil de gestor. Consegue me confirmar seu papel no sistema?",
        timestamp: "2026-05-16T10:46:00-03:00",
      },
    ],
    createdAt: "2026-05-16T10:42:00-03:00",
    updatedAt: "2026-05-16T10:46:00-03:00",
    firstResponseDueAt: "2026-05-16T10:50:00-03:00",
    unreadCount: 0,
  },
  {
    id: "ticket-document-import",
    organizationId: "organization-1",
    protocol: "LD-SUP-1842",
    subject: "Solicitacao de despesa importada com itens errados",
    status: "resolved",
    priority: "low",
    requester: {
      name: "Marcos Vieira",
      email: "marcos.vieira@prefeitura.gov.br",
      organization: "Prefeitura de Itabira",
    },
    assignee: DEFAULT_SUPPORT_AGENT,
    context: {
      screen: "Importar PDF",
      route: "/app/processo/novo",
      source: "process",
      entityLabel: "Solicitacao de despesa 041/2026",
    },
    attachments: [
      {
        id: "attachment-import-screen",
        type: "screenshot",
        name: "captura-importacao.png",
        description: "Captura com divergencia nos itens importados.",
        messageId: "message-import-user-1",
      },
    ],
    messages: [
      {
        id: "message-import-user-1",
        role: "user",
        authorName: "Marcos Vieira",
        content: "O PDF foi importado, mas dois itens ficaram agrupados de forma errada.",
        timestamp: "2026-05-15T16:10:00-03:00",
      },
      {
        id: "message-import-support-1",
        role: "support",
        authorName: "Admin LicitaDoc",
        content:
          "Ajustei a orientacao do fluxo. Voce pode revisar os itens antes de gerar o processo.",
        timestamp: "2026-05-15T16:22:00-03:00",
      },
    ],
    createdAt: "2026-05-15T16:10:00-03:00",
    updatedAt: "2026-05-15T16:22:00-03:00",
    firstResponseDueAt: "2026-05-15T16:18:00-03:00",
    unreadCount: 0,
  },
];

export function getInitialSupportTicketId(tickets: SupportTicket[]) {
  return tickets.find((ticket) => ticket.status !== "resolved")?.id ?? tickets[0]?.id ?? null;
}

export function getTicketSlaState(ticket: SupportTicket, nowIso = SUPPORT_NOW) {
  if (ticket.status === "resolved") {
    return "done" as const;
  }

  const now = new Date(nowIso).getTime();
  const due = new Date(ticket.firstResponseDueAt).getTime();
  const minutes = Math.round((due - now) / 60000);

  if (minutes < 0) {
    return "breached" as const;
  }

  if (minutes <= 3) {
    return "warning" as const;
  }

  return "ok" as const;
}

function getValidDate(iso?: string | null) {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateParts(date: Date) {
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
}

function isSameLocalDay(first: Date, second: Date) {
  const firstParts = getDateParts(first);
  const secondParts = getDateParts(second);

  return (
    firstParts.day === secondParts.day &&
    firstParts.month === secondParts.month &&
    firstParts.year === secondParts.year
  );
}

function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(date: Date, now: Date) {
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { day: "2-digit", month: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "numeric" };

  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

export function formatSupportExactTimestamp(iso?: string | null) {
  const date = getValidDate(iso);

  if (!date) {
    return "sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(",", " às");
}

export function formatSupportChatTime(iso?: string | null) {
  const date = getValidDate(iso);

  if (!date) {
    return "sem hora";
  }

  return formatClock(date);
}

export function formatSupportDayLabel(iso?: string | null, nowIso = SUPPORT_NOW) {
  const date = getValidDate(iso);
  const now = getValidDate(nowIso) ?? getValidDate(SUPPORT_NOW);

  if (!date || !now) {
    return "Sem data";
  }

  if (isSameLocalDay(date, now)) {
    return "Hoje";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameLocalDay(date, yesterday)) {
    return "Ontem";
  }

  return formatShortDate(date, now);
}

export function formatSupportQueueFreshness(
  iso?: string | null,
  nowIso = SUPPORT_NOW,
): SupportQueueTimeDisplay {
  const date = getValidDate(iso);
  const now = getValidDate(nowIso) ?? getValidDate(SUPPORT_NOW);

  if (!date || !now) {
    return {
      label: "sem data",
      title: "Sem data registrada",
      ariaLabel: "Ultima atividade sem data registrada",
    };
  }

  const exact = formatSupportExactTimestamp(iso);

  if (!isSameLocalDay(date, now)) {
    const label = formatSupportDayLabel(iso, nowIso).toLocaleLowerCase("pt-BR");

    return {
      label,
      title: exact,
      ariaLabel: `Ultima atividade ${label}, ${exact}`,
    };
  }

  const minutes = Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / 60000),
  );
  let label: string;

  if (minutes < 1) {
    label = "agora";
  } else if (minutes < 60) {
    label = `há ${minutes} min`;
  } else {
    const hours = Math.max(1, Math.round(minutes / 60));
    label = `há ${hours} h`;
  }

  return {
    label,
    title: exact,
    ariaLabel: `Ultima atividade ${label}, ${exact}`,
  };
}

export function formatSupportRelativeTime(iso: string, nowIso = SUPPORT_NOW) {
  return formatSupportQueueFreshness(iso, nowIso).label;
}

export function getSupportMessageTimeline(
  messages: SupportTicketMessage[],
  nowIso = SUPPORT_NOW,
): SupportMessageTimelineItem[] {
  const timeline: SupportMessageTimelineItem[] = [];
  let previousDayKey: string | null = null;

  messages.forEach((message) => {
    const date = getValidDate(message.timestamp);
    const dayKey = date ? getLocalDayKey(date) : `invalid-${message.id}`;
    const dayLabel = formatSupportDayLabel(message.timestamp, nowIso);

    if (dayKey !== previousDayKey) {
      timeline.push({
        type: "day",
        id: `day-${dayKey}`,
        label: dayLabel,
      });
      previousDayKey = dayKey;
    }

    timeline.push({
      type: "message",
      id: message.id,
      message,
      timeLabel: formatSupportChatTime(message.timestamp),
      timestampTitle: formatSupportExactTimestamp(message.timestamp),
      dayLabel,
    });
  });

  return timeline;
}

export function getSupportTicketStats(tickets: SupportTicket[], nowIso = SUPPORT_NOW) {
  return {
    open: tickets.filter((ticket) => ticket.status === "open").length,
    waiting: tickets.filter((ticket) => ticket.status === "waiting").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    attention: tickets.filter((ticket) => {
      const state = getTicketSlaState(ticket, nowIso);
      return state === "warning" || state === "breached";
    }).length,
  };
}

export function getSupportTicketQueueCounts(
  tickets: SupportTicket[],
  nowIso = SUPPORT_NOW,
): SupportTicketQueueCounts {
  const stats = getSupportTicketStats(tickets, nowIso);

  return {
    all: stats.open + stats.waiting + stats.resolved,
    ...stats,
  };
}

export function filterSupportTickets(
  tickets: SupportTicket[],
  filters: SupportTicketFilters,
  agent: SupportAgent = DEFAULT_SUPPORT_AGENT,
) {
  const search = filters.search.trim().toLowerCase();

  return tickets.filter((ticket) => {
    if (filters.status !== "all" && ticket.status !== filters.status) {
      return false;
    }

    if (filters.priority !== "all" && ticket.priority !== filters.priority) {
      return false;
    }

    if (filters.source !== "all" && ticket.context.source !== filters.source) {
      return false;
    }

    if (filters.assignee === "unassigned" && ticket.assignee !== null) {
      return false;
    }

    if (filters.assignee === "mine" && ticket.assignee?.id !== agent.id) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      ticket.protocol,
      ticket.subject,
      ticket.requester.name,
      ticket.requester.email,
      ticket.requester.organization ?? "",
      ticket.context.screen,
      ticket.context.route,
      ticket.context.entityLabel ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function getSelectedSupportTicket(
  tickets: SupportTicket[],
  selectedTicketId: string | null,
) {
  return tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0] ?? null;
}

export function assignSupportTicketToAgent(
  tickets: SupportTicket[],
  ticketId: string,
  agent: SupportAgent,
) {
  return tickets.map((ticket) =>
    ticket.id === ticketId ? { ...ticket, assignee: { id: agent.id, name: agent.name } } : ticket,
  );
}

export function updateSupportTicketPriority(
  tickets: SupportTicket[],
  ticketId: string,
  priority: SupportTicketPriority,
) {
  return tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, priority } : ticket));
}

export function updateSupportTicketStatus(
  tickets: SupportTicket[],
  ticketId: string,
  status: SupportTicketStatus,
) {
  return tickets.map((ticket) =>
    ticket.id === ticketId
      ? { ...ticket, status, unreadCount: status === "resolved" ? 0 : ticket.unreadCount }
      : ticket,
  );
}

export function createSupportReply(content: string, agent: SupportAgent, nowIso = SUPPORT_NOW) {
  return {
    id: `reply-${nowIso}-${content.length}`,
    role: "support" as const,
    authorName: agent.name,
    content: content.trim(),
    timestamp: nowIso,
  };
}

export function appendSupportReply(
  tickets: SupportTicket[],
  ticketId: string,
  content: string,
  agent: SupportAgent,
  nowIso = SUPPORT_NOW,
): SupportTicket[] {
  const trimmed = content.trim();

  if (!trimmed) {
    return tickets;
  }

  return tickets.map((ticket) =>
    ticket.id === ticketId
      ? {
          ...ticket,
          status: ticket.status === "resolved" ? ("resolved" as const) : ("waiting" as const),
          assignee: ticket.assignee ?? { id: agent.id, name: agent.name },
          unreadCount: 0,
          updatedAt: nowIso,
          messages: [...ticket.messages, createSupportReply(trimmed, agent, nowIso)],
        }
      : ticket,
  );
}

export function getLatestTicketPreview(ticket: SupportTicket) {
  return ticket.messages.at(-1)?.content ?? ticket.subject;
}
