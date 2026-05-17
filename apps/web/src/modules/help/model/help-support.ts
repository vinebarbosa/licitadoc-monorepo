import type { HelpContext } from "./help-context";

export type SupportAttachment = {
  type: "screenshot" | "image";
  title: string;
  subtitle: string;
  mimeType?: string;
  sizeBytes?: number;
  url?: string;
};

export type SupportMessage = {
  id: string;
  role: "support" | "user" | "system";
  content: string;
  time: string;
  attachments?: SupportAttachment[];
  status?: "sent" | "read";
};

export type SupportHistoryStatus = "active" | "waiting" | "resolved";

export type SupportHistoryRecord = {
  id: string;
  protocol: string;
  title: string;
  latestPreview: string;
  timestamp: string;
  status: SupportHistoryStatus;
  hasScreenshot: boolean;
  messages: SupportMessage[];
};

export type SupportContextLabel = {
  label: string;
  value: string;
};

export const SUPPORT_ESTIMATED_RESPONSE = "Tempo estimado: até 8 min";

export const SEEDED_SUPPORT_HISTORY: SupportHistoryRecord[] = [
  {
    id: "support-history-seeded-document",
    protocol: "LD-DOCUMENTOS-1233",
    title: "Dúvida sobre documento em geração",
    latestPreview: "O documento terminou de gerar e já está disponível na prévia.",
    timestamp: "Hoje, 08:42",
    status: "resolved",
    hasScreenshot: true,
    messages: [
      {
        id: "seeded-document-system",
        role: "system",
        content: "Atendimento LD-DOCUMENTOS-1233 iniciado",
        time: "08:31",
      },
      {
        id: "seeded-document-screenshot",
        role: "user",
        content: "Captura de tela anexada",
        time: "08:31",
        status: "read",
        attachments: [
          {
            type: "screenshot",
            title: "Captura de tela",
            subtitle: "Ajuda em documentos",
          },
        ],
      },
      {
        id: "seeded-document-user",
        role: "user",
        content: "O documento ficou em geração por muito tempo.",
        time: "08:32",
        status: "read",
      },
      {
        id: "seeded-document-support",
        role: "support",
        content: "O documento terminou de gerar e já está disponível na prévia.",
        time: "08:42",
      },
    ],
  },
  {
    id: "support-history-seeded-process",
    protocol: "LD-PROCESSOS-1096",
    title: "Como revisar dados do processo",
    latestPreview: "Confira objeto, itens e departamentos antes de gerar documentos.",
    timestamp: "Ontem, 16:10",
    status: "waiting",
    hasScreenshot: false,
    messages: [
      {
        id: "seeded-process-system",
        role: "system",
        content: "Atendimento LD-PROCESSOS-1096 iniciado",
        time: "15:58",
      },
      {
        id: "seeded-process-user",
        role: "user",
        content: "Quero confirmar se revisei todos os dados antes de gerar documentos.",
        time: "15:59",
        status: "read",
      },
      {
        id: "seeded-process-support",
        role: "support",
        content: "Confira objeto, itens e departamentos antes de gerar documentos.",
        time: "16:10",
      },
    ],
  },
];

export function getSupportContextLabels(
  context: HelpContext,
  pathname: string,
): SupportContextLabel[] {
  return [
    {
      label: "Tela",
      value: context.title.replace(/^Ajuda (na|no|em|para) /, ""),
    },
    {
      label: "Fluxo",
      value: context.subtitle,
    },
    {
      label: "Rota",
      value: pathname || "/app",
    },
  ];
}

export function createSupportProtocol(contextKey: string) {
  const suffix = String(contextKey.length * 137)
    .padStart(4, "0")
    .slice(-4);
  return `LD-${contextKey.toUpperCase().replace(/[^A-Z0-9]/g, "-")}-${suffix}`;
}

export function getSupportIntakeMessage(context: HelpContext) {
  return `Descreva o que está impedindo seu avanço em ${context.title.toLowerCase()}. Você pode anexar uma captura para mostrar o que apareceu na tela.`;
}

export function getInitialSupportReply(context: HelpContext) {
  return `Recebi sua solicitação sobre ${context.title.toLowerCase()}. Vou organizar o atendimento com base no contexto da tela e te responder por aqui.`;
}

export function getDeterministicSupportReply(message: string) {
  const normalizedMessage = message.toLocaleLowerCase("pt-BR");

  if (normalizedMessage.includes("erro") || normalizedMessage.includes("falha")) {
    return "Entendi o erro. Antes de tentar novamente, confirme se os dados obrigatórios estão preenchidos e se a tela não mostra campos pendentes. Se continuar, registre o horário aproximado para análise do suporte.";
  }

  if (normalizedMessage.includes("document")) {
    return "Certo. Para documento, informe o processo vinculado, o tipo de documento e em qual etapa a geração ou revisão parou. Com isso o suporte consegue localizar o ponto exato.";
  }

  if (normalizedMessage.includes("pdf")) {
    return "Perfeito. Para PDF, confira se o arquivo é legível e corresponde a uma solicitação de despesa. Se a importação falhar, envie o nome do arquivo e a mensagem exibida.";
  }

  return "Recebido. Vou considerar o contexto desta tela e seguir com uma orientação operacional segura para você continuar o trabalho.";
}

export function getSupportStatusLabel(status: SupportHistoryStatus) {
  switch (status) {
    case "active":
      return "Em atendimento";
    case "waiting":
      return "Aguardando retorno";
    case "resolved":
      return "Resolvido";
  }
}

export function createSupportHistoryEntry({
  protocol,
  issue,
  messages,
  hasScreenshot,
}: {
  protocol: string;
  issue: string;
  messages: SupportMessage[];
  hasScreenshot: boolean;
}): SupportHistoryRecord {
  return {
    id: `history-${protocol.toLocaleLowerCase("pt-BR")}`,
    protocol,
    title: issue,
    latestPreview: issue,
    timestamp: "Agora",
    status: "active",
    hasScreenshot,
    messages,
  };
}

export function updateSupportHistoryEntry(
  history: SupportHistoryRecord[],
  recordId: string,
  messages: SupportMessage[],
  latestPreview: string,
): SupportHistoryRecord[] {
  return history.map((record) =>
    record.id === recordId
      ? {
          ...record,
          latestPreview,
          timestamp: "Agora",
          status: record.status === "resolved" ? "resolved" : "active",
          messages,
        }
      : record,
  );
}
