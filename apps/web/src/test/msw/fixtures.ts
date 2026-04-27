export const healthOkResponse = {
  status: "ok",
};

export const anonymousSessionResponse = null;

export const authenticatedSessionResponse = {
  session: {
    id: "session-1",
    token: "session-token",
    userId: "user-1",
    expiresAt: "2026-05-25T00:00:00.000Z",
    createdAt: "2026-04-25T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
  },
  user: {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@licitadoc.test",
    role: "member",
    organizationId: "organization-1",
    createdAt: "2026-04-25T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
  },
};

export const organizationsListResponse = {
  items: [
    {
      id: "organization-1",
      name: "Prefeitura de Sao Paulo",
      slug: "prefeitura-de-sao-paulo",
      officialName: "Prefeitura Municipal de Sao Paulo",
      cnpj: "00.000.000/0001-00",
      city: "Sao Paulo",
      state: "SP",
      address: "Praca da Se, 1",
      zipCode: "01000-000",
      phone: "1133330000",
      institutionalEmail: "contato@saopaulo.gov.br",
      website: null,
      logoUrl: null,
      authorityName: "Maria Silva",
      authorityRole: "Prefeita",
      isActive: true,
      createdByUserId: "user-1",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 100,
  total: 1,
  totalPages: 1,
};

export const departmentsListResponse = {
  items: [
    {
      id: "department-1",
      name: "Secretaria de Educacao",
      slug: "secretaria-de-educacao",
      organizationId: "organization-1",
      budgetUnitCode: "06.001",
      responsibleName: "Maria Costa",
      responsibleRole: "Secretaria",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 100,
  total: 1,
  totalPages: 1,
};

export const usersListResponse = {
  items: [
    {
      id: "user-1",
      name: "Maria Silva",
      email: "maria@licitadoc.test",
      emailVerified: true,
      image: null,
      role: "admin",
      organizationId: "organization-1",
      createdAt: "2026-04-25T00:00:00.000Z",
      updatedAt: "2026-04-25T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
};

export const documentsListResponse = {
  items: [
    {
      id: "document-1",
      name: "DFD - PE-2024-045",
      organizationId: "organization-1",
      processId: "process-1",
      processNumber: "PE-2024-045",
      type: "dfd",
      status: "completed",
      responsibles: ["Maria Costa"],
      createdAt: "2024-03-20T00:00:00.000Z",
      updatedAt: "2024-03-20T00:00:00.000Z",
    },
    {
      id: "document-2",
      name: "ETP - PE-2024-045",
      organizationId: "organization-1",
      processId: "process-1",
      processNumber: "PE-2024-045",
      type: "etp",
      status: "generating",
      responsibles: ["Maria Costa"],
      createdAt: "2024-03-28T00:00:00.000Z",
      updatedAt: "2024-03-28T00:00:00.000Z",
    },
    {
      id: "document-3",
      name: "Minuta - PE-2024-043",
      organizationId: "organization-1",
      processId: "process-2",
      processNumber: "PE-2024-043",
      type: "minuta",
      status: "failed",
      responsibles: ["Ana Santos"],
      createdAt: "2024-03-24T00:00:00.000Z",
      updatedAt: "2024-03-24T00:00:00.000Z",
    },
  ],
};

export const documentDetailResponse = {
  id: "document-1",
  name: "DFD - PE-2024-045",
  organizationId: "organization-1",
  processId: "process-1",
  processNumber: "PE-2024-045",
  type: "dfd",
  status: "completed",
  responsibles: ["Maria Costa"],
  createdAt: "2024-03-20T00:00:00.000Z",
  updatedAt: "2024-03-20T00:00:00.000Z",
  draftContent: `# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)

**Processo:** PE-2024-045

## 1. Objeto

Contratacao de Servicos de TI para suporte tecnico especializado.

## 2. Justificativa

A contratacao se justifica pela *necessidade de manutencao* dos sistemas institucionais:

- Suporte a infraestrutura de rede
- Manutencao de servidores
- Atendimento a usuarios internos

## 3. Estimativa de Valor

| Item | Quantidade | Valor Unitario | Valor Total |
|------|-----------|---------------|-------------|
| Suporte mensal | 12 | R$ 15.000,00 | R$ 180.000,00 |
| Licencas | 50 | R$ 500,00 | R$ 25.000,00 |

> Esta estimativa foi baseada em pesquisa de mercado realizada em março de 2024.

Veja detalhes em [edital PE-2024-045](https://licitadoc.test/editais/pe-2024-045).`,
  storageKey: null,
};

export const generatingDocumentDetailResponse = {
  ...documentDetailResponse,
  id: "document-2",
  name: "ETP - PE-2024-045",
  type: "etp",
  status: "generating",
  draftContent: null,
};

export const failedDocumentDetailResponse = {
  ...documentDetailResponse,
  id: "document-3",
  name: "Minuta - PE-2024-043",
  processId: "process-2",
  processNumber: "PE-2024-043",
  type: "minuta",
  status: "failed",
  responsibles: ["Ana Santos"],
  draftContent: null,
};

export const emptyDocumentDetailResponse = {
  ...documentDetailResponse,
  id: "document-empty",
  name: "TR - PE-2024-045",
  type: "tr",
  status: "completed",
  draftContent: "",
};

export const processesListResponse = {
  items: [
    {
      id: "process-1",
      organizationId: "organization-1",
      type: "pregao-eletronico",
      processNumber: "PE-2024-045",
      externalId: null,
      issuedAt: "2024-03-01T00:00:00.000Z",
      object: "Contratação de Serviços de TI",
      justification: "Necessidade de suporte técnico especializado.",
      responsibleName: "Maria Costa",
      status: "em_edicao",
      sourceKind: null,
      sourceReference: null,
      sourceMetadata: null,
      departmentIds: ["department-1"],
      createdAt: "2024-03-01T00:00:00.000Z",
      updatedAt: "2024-03-28T00:00:00.000Z",
      documents: {
        completedCount: 2,
        totalRequiredCount: 4,
        completedTypes: ["dfd", "etp"],
        missingTypes: ["tr", "minuta"],
      },
      listUpdatedAt: "2024-03-28T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
};

export const processCreateResponse = {
  id: "process-created",
  organizationId: "organization-1",
  type: "pregao",
  processNumber: "PROC-2026-001",
  externalId: null,
  issuedAt: "2026-01-08T00:00:00.000Z",
  object: "Objeto do processo",
  justification: "Justificativa do processo",
  responsibleName: "Maria Costa",
  status: "draft",
  sourceKind: null,
  sourceReference: null,
  sourceMetadata: null,
  departmentIds: ["department-1"],
  createdAt: "2026-04-26T00:00:00.000Z",
  updatedAt: "2026-04-26T00:00:00.000Z",
};

export const processDetailResponse = {
  id: "process-1",
  organizationId: "organization-1",
  type: "pregao-eletronico",
  processNumber: "PE-2024-045",
  externalId: null,
  issuedAt: "2024-03-01T00:00:00.000Z",
  object: "Contratação de Serviços de TI",
  justification: "Necessidade de suporte técnico especializado.",
  responsibleName: "Maria Costa",
  status: "em_edicao",
  sourceKind: null,
  sourceReference: null,
  sourceMetadata: null,
  departmentIds: ["department-1"],
  createdAt: "2024-03-15T00:00:00.000Z",
  updatedAt: "2024-03-28T00:00:00.000Z",
  departments: [
    {
      id: "department-1",
      organizationId: "organization-1",
      name: "Secretaria de Educacao",
      budgetUnitCode: "06.001",
      label: "06.001 - Secretaria de Educacao",
    },
  ],
  estimatedValue: "R$ 450.000,00",
  documents: [
    {
      type: "dfd",
      label: "DFD",
      title: "Documento de Formalização de Demanda",
      description: "Justificativa da necessidade de contratação",
      status: "concluido",
      documentId: "document-1",
      lastUpdatedAt: "2024-03-20T00:00:00.000Z",
      progress: null,
      availableActions: {
        create: false,
        edit: true,
        view: true,
      },
    },
    {
      type: "etp",
      label: "ETP",
      title: "Estudo Técnico Preliminar",
      description: "Análise técnica e levantamento de soluções",
      status: "em_edicao",
      documentId: "document-2",
      lastUpdatedAt: "2024-03-28T00:00:00.000Z",
      progress: 75,
      availableActions: {
        create: false,
        edit: true,
        view: true,
      },
    },
    {
      type: "tr",
      label: "TR",
      title: "Termo de Referência",
      description: "Especificações técnicas e requisitos",
      status: "pendente",
      documentId: null,
      lastUpdatedAt: null,
      progress: null,
      availableActions: {
        create: true,
        edit: false,
        view: false,
      },
    },
    {
      type: "minuta",
      label: "Minuta",
      title: "Minuta do Contrato",
      description: "Cláusulas e condições contratuais",
      status: "erro",
      documentId: "document-3",
      lastUpdatedAt: "2024-03-26T00:00:00.000Z",
      progress: null,
      availableActions: {
        create: false,
        edit: true,
        view: true,
      },
    },
  ],
  detailUpdatedAt: "2024-03-28T00:00:00.000Z",
};

export const documentCreateResponse = {
  id: "document-created",
  name: "DFD - PE-2024-045",
  organizationId: "organization-1",
  processId: "process-1",
  processNumber: "PE-2024-045",
  type: "dfd",
  status: "generating",
  responsibles: ["Maria Silva"],
  createdAt: "2026-04-26T00:00:00.000Z",
  updatedAt: "2026-04-26T00:00:00.000Z",
};
