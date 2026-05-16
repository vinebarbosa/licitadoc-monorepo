export type HelpQuickActionId = "generate-document" | "import-pdf" | "invite-member" | "support";

export type HelpQuickAction = {
  id: HelpQuickActionId;
  label: string;
  description: string;
};

export type HelpContext = {
  key: string;
  title: string;
  subtitle: string;
  suggestions: string[];
  quickActions: HelpQuickAction[];
};

export const HELP_QUICK_ACTIONS: HelpQuickAction[] = [
  {
    id: "generate-document",
    label: "Gerar documento",
    description: "Criar DFD, ETP, TR ou minuta.",
  },
  {
    id: "import-pdf",
    label: "Importar PDF",
    description: "Usar uma solicitação de despesa.",
  },
  {
    id: "invite-member",
    label: "Convidar membro",
    description: "Adicionar pessoas à equipe.",
  },
  {
    id: "support",
    label: "Falar com suporte",
    description: "Receber orientação operacional.",
  },
];

const GENERAL_CONTEXT: HelpContext = {
  key: "general",
  title: "Ajuda do LicitaDoc",
  subtitle: "Orientação rápida para continuar seu trabalho",
  suggestions: [
    "Como encontro processos em andamento?",
    "Quais documentos posso gerar no LicitaDoc?",
    "Como revisar as informações antes de concluir?",
  ],
  quickActions: HELP_QUICK_ACTIONS,
};

const HELP_CONTEXTS: Record<string, HelpContext> = {
  home: {
    key: "home",
    title: "Ajuda na Central de Trabalho",
    subtitle: "Atalhos para processos, documentos e pendências",
    suggestions: [
      "O que devo revisar primeiro na central?",
      "Como continuo um documento em rascunho?",
      "Como crio um novo processo a partir daqui?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  processes: {
    key: "processes",
    title: "Ajuda em processos",
    subtitle: "Dúvidas sobre listagem, filtros e acompanhamento",
    suggestions: [
      "Como acompanho processos por status?",
      "Onde vejo os documentos de um processo?",
      "Como identificar processos próximos do prazo?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  "process-create": {
    key: "process-create",
    title: "Ajuda no novo processo",
    subtitle: "Preencha dados, departamentos e documentos de origem",
    suggestions: [
      "Quais campos são obrigatórios para criar um processo?",
      "Como importar uma solicitação de despesa em PDF?",
      "Como escolher os departamentos responsáveis?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  "process-detail": {
    key: "process-detail",
    title: "Ajuda no detalhe do processo",
    subtitle: "Consulte dados, copie informações e gere documentos",
    suggestions: [
      "Como gero documentos para este processo?",
      "Como confiro os itens importados da solicitação?",
      "Onde copio os dados principais do processo?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  "process-edit": {
    key: "process-edit",
    title: "Ajuda na edição do processo",
    subtitle: "Atualize dados preservando rastreabilidade",
    suggestions: [
      "Quais alterações afetam os documentos já gerados?",
      "Como ajustar departamentos vinculados?",
      "Como revisar o objeto antes de salvar?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  documents: {
    key: "documents",
    title: "Ajuda em documentos",
    subtitle: "Geração, status e revisão de documentos",
    suggestions: [
      "Como filtro documentos por tipo?",
      "O que significa um documento em geração?",
      "Como abro a prévia de um documento concluído?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  "document-create": {
    key: "document-create",
    title: "Ajuda para gerar documento",
    subtitle: "Escolha processo, tipo e acompanhe a geração",
    suggestions: [
      "Qual tipo de documento devo gerar agora?",
      "Como escolher o processo correto?",
      "O que fazer enquanto a geração está em andamento?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  "document-preview": {
    key: "document-preview",
    title: "Ajuda na prévia do documento",
    subtitle: "Revise, ajuste e imprima com segurança",
    suggestions: [
      "Como reviso o texto gerado antes de imprimir?",
      "Como solicito um ajuste no documento?",
      "Como volto para a lista de documentos?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  members: {
    key: "members",
    title: "Ajuda em membros",
    subtitle: "Convites e acesso da equipe",
    suggestions: [
      "Como envio um convite para novo membro?",
      "Qual perfil devo usar para a equipe?",
      "Como acompanho convites pendentes?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
  users: {
    key: "users",
    title: "Ajuda em usuários",
    subtitle: "Administração de acesso e organizações",
    suggestions: [
      "Como encontro usuários de uma organização?",
      "Quando devo alterar um perfil de acesso?",
      "Como lidar com um convite expirado?",
    ],
    quickActions: HELP_QUICK_ACTIONS,
  },
};

export function getContextualHelpContext(pathname: string): HelpContext {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/app") {
    return HELP_CONTEXTS.home;
  }

  if (path === "/app/processo/novo") {
    return HELP_CONTEXTS["process-create"];
  }

  if (/^\/app\/processo\/[^/]+\/editar$/.test(path)) {
    return HELP_CONTEXTS["process-edit"];
  }

  if (/^\/app\/processo\/[^/]+$/.test(path)) {
    return HELP_CONTEXTS["process-detail"];
  }

  if (path === "/app/processos") {
    return HELP_CONTEXTS.processes;
  }

  if (path === "/app/documento/novo") {
    return HELP_CONTEXTS["document-create"];
  }

  if (/^\/app\/documento\/[^/]+\/preview$/.test(path)) {
    return HELP_CONTEXTS["document-preview"];
  }

  if (path === "/app/documentos") {
    return HELP_CONTEXTS.documents;
  }

  if (path === "/app/membros") {
    return HELP_CONTEXTS.members;
  }

  if (path === "/admin/usuarios") {
    return HELP_CONTEXTS.users;
  }

  return GENERAL_CONTEXT;
}
