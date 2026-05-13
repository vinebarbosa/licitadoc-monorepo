import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { test } from "vitest";
import {
  departments,
  documents,
  type organizations,
  processDepartments,
  processes,
} from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import type { FileStorageProvider } from "../../shared/storage/types";
import { createProcess } from "./create-process";
import { createProcessFromExpenseRequest } from "./create-process-from-expense-request";
import { createProcessFromExpenseRequestText } from "./expense-request-intake";
import { parseExpenseRequestText } from "./expense-request-parser";
import {
  createProcessFromExpenseRequestPdf,
  extractTextFromPdf,
  normalizeExpenseRequestPdfUpload,
} from "./expense-request-pdf";
import { getProcess } from "./get-process";
import { getProcesses } from "./get-processes";
import { createProcessBodySchema, updateProcessBodySchema } from "./processes.schemas";
import { deriveConciseProcessTitle } from "./processes.shared";
import { updateProcess } from "./update-process";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const OTHER_ORGANIZATION_ID = "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228";
const PROCESS_ID = "1f1f1f1f-e2e5-4876-b4c3-b35306c6e733";
const DEPARTMENT_ID = "9f9f9f9f-e2e5-4876-b4c3-b35306c6e733";
const SECOND_DEPARTMENT_ID = "8f8f8f8f-e2e5-4876-b4c3-b35306c6e733";
const DOCUMENT_ID = "7a7a7a7a-e2e5-4876-b4c3-b35306c6e733";
const PUREZA_EXPENSE_REQUEST_TEXT = `
PRACA 05 DE ABRIL, 180, CENTRO, PUREZA/RN CEP: 59582000
CNPJ: 08.290.223/0001-42
Solicitacao de
Despesa
MUNICIPIO DE PUREZA
Unidade Orcamentaria: 06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer
N Solicitação:
6
Data Emissao:
08/01/2026 10/2026
Processo:
Servico
Classificacao:
Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI, para abrilhantar as festividades do Carnaval de Pureza 2026, que sera realizado de 13 a 17 de fevereiro.
Objeto:
O Municipio de Pureza/RN realizara, no periodo de 13 a 17 de fevereiro de 2026, o Carnaval de Pureza 2026.
A programacao carnavalesca tem como finalidade promover o acesso a cultura.
Justificativa:
Item Descricao Qtd. Und Vlr. Unitario Vlr. TotalLote FatorQtd.Ini
apresentacao artistica musical da banda FORRO TSUNAMI, para abrilhantar as festividades do Carnaval de Pureza 2026, que sera realizado de 13 a 17 de fevereiro, com duracao de 02 horas de show.
0005091  1  0,00  0,00SERVICO
0,00Valor Total:
SECRETARIO DE EDUCACAO, CULTURA, ESPORTE E LAZER
MARIA MARILDA SILVA DA ROCHA
878.541.554-53
SECRETARIO DE EDUCACAO, CULTURA, ESPORTE E LAZER
`;

const KIT_ESCOLAR_EXPENSE_REQUEST_TEXT = `
PREFEITURA MUNICIPAL
CNPJ: 12.345.678/0001-90
Solicitacao de
Despesa
MUNICIPIO TESTE
Unidade Orcamentaria: 06.001 - Secretaria Municipal de Educacao
N Solicitacao:
42
Data Emissao:
15/02/2026
Processo:
Dispensa
Classificacao:
Aquisicao de kit escolar para estudantes da rede municipal de ensino.
Objeto:
Distribuicao de kits escolares aos estudantes matriculados na rede municipal.
Justificativa:
Item Descricao Qtd. Und Vlr. Unitario Vlr. TotalLote FatorQtd.Ini
KIT ESCOLAR: EDUCACAO INFANTIL 01 CADERNO BROCHURA - DESCRICAO: capa flexivel com 96 folhas. 02 LAPIS GRAFITE No 02 - DESCRICAO: produto atoxico. 03 BORRACHA PONTEIRA - DESCRICAO: embalagem deve conter identificacao do fabricante. 0005113 550 0,00 0,00KIT
KIT ESCOLAR: ENSINO FUNDAMENTAL I 01 CADERNO ESPIRAL - DESCRICAO: formato universitario. 02 APONTADOR COM DEPOSITO - DESCRICAO: certificacao INMETRO quando aplicavel. 03 LAPIS DE COR 12 CORES - DESCRICAO: composicao em madeira reflorestada. 0005114 300 0,00 0,00KIT
KIT ESCOLAR: ENSINO FUNDAMENTAL II 01 CANETA ESFEROGRAFICA AZUL - DESCRICAO: validade minima de 12 meses. 02 COLA BRANCA 90G - DESCRICAO: embalagem individual. 03 TESOURA ESCOLAR - DESCRICAO: ponta arredondada. 0005115 470 0,00 0,00KIT
0,00Valor Total:
SECRETARIO MUNICIPAL
MARIA DA SILVA
111.222.333-44
SECRETARIO MUNICIPAL
`;

const KIT_ESCOLAR_WITH_PAGE_HEADERS_EXPENSE_REQUEST_TEXT = `
PREFEITURA MUNICIPAL
CNPJ: 12.345.678/0001-90
Solicitacao de
Despesa
MUNICIPIO TESTE
Unidade Orcamentaria: 06.001 - Secretaria Municipal de Educacao
N Solicitacao:
44
Data Emissao:
17/02/2026
Processo:
Dispensa
Classificacao:
Aquisicao de kit escolar para estudantes da rede municipal de ensino.
Objeto:
Distribuicao de kits escolares aos estudantes matriculados na rede municipal.
Justificativa:
Item Descricao Qtd. Und Vlr. Unitario Vlr. TotalLote FatorQtd.Ini
KIT ESCOLAR: EDUCACAO INFANTIL - 01 CADERNO COM BROCHURA - DESCRICAO: capa flexivel. 02 LAPIS GRAFITE No 02: formato cilindrico. 03 BORRACHA PONTEIRA BRANCA - DESCRICAO: borracha macia. 0005113 550 0,00 0,00KIT . PRACA 05 DE ABRIL, 180, CENTRO, PUREZA/RN CEP: 59582000 CNPJ: 08.290.223/0001-42 Solicitacao de Despesa MUNICIPIO DE PUREZA Sistema Orcamentario, Financeiro e Contabil Pag.: 2/4 04 TINTA GUACHE CAIXA COM 06 CORES (15 ML) - DESCRICAO: produto atoxico. 05 TOALHA DE MAO - DESCRICAO: tecido atoalhado. 06 SQUEZZE PLASTICA 500ML - DESCRICAO: cor branca.
KIT ESCOLAR: ENSINO FUNDAMENTAL I (ALFABETIZACAO 1o AO 2o ANO) 01 UNIDADE CADERNO COM BROCHURA - DESCRICAO: capa flexivel. 02 APONTADOR DE LAPIS - DESCRICAO: com deposito. 03 BORRACHA ESCOLAR BRANCA 20G - DESCRICAO: macia. 0005114 300 0,00 0,00KIT . PRACA 05 DE ABRIL, 180, CENTRO, PUREZA/RN CEP: 59582000 CNPJ: 08.290.223/0001-42 Solicitacao de Despesa MUNICIPIO DE PUREZA Sistema Orcamentario, Financeiro e Contabil Pag.: 3/4 04 TESOURA ESCOLAR INFANTIL SEM PONTAS - DESCRICAO: ponta arredondada. 05 SQUEZZE PLASTICA 500ML - DESCRICAO: cor branca.
KIT ESCOLAR: ENSINO FUDAMENTAL I - (SISTEMATIZACAO 3o,4o E 5o ANO) 01 CADERNO ESPIRAL COM CAPA DURA 10 MATERIAS - DESCRICAO: capa dura. 02 LAPIS GRAFITE No 02: madeira reflorestada. 03 APONTADOR DE LAPIS - DESCRICAO: com deposito. 04 BORRACHA ESCOLAR BRANCA 20G - DESCRICAO: macia. 05 COLA BRANCA 90G PARA USO ESCOLAR: produto atoxico. 0005115 470 0,00 0,00KIT
0,00Valor Total:
SECRETARIO MUNICIPAL
MARIA DA SILVA
111.222.333-44
SECRETARIO MUNICIPAL
`;

const MULTI_ITEM_EXPENSE_REQUEST_TEXT = `
PREFEITURA MUNICIPAL
CNPJ: 12.345.678/0001-90
Solicitacao de
Despesa
MUNICIPIO TESTE
Unidade Orcamentaria: 04.001 - Secretaria Municipal de Administracao
N Solicitacao:
43
Data Emissao:
16/02/2026
Processo:
Dispensa
Classificacao:
Aquisicao de materiais de expediente para manutencao das atividades administrativas.
Objeto:
Reposicao de materiais de expediente utilizados nas unidades administrativas.
Justificativa:
Item Descricao Qtd. Und Vlr. Unitario Vlr. TotalLote FatorQtd.Ini
PAPEL A4 branco alcalino, embalagem com 500 folhas, certificacao ambiental quando aplicavel. 0006001 120 0,00 0,00RESMA
CANETA ESFEROGRAFICA azul, corpo transparente e ponta media. 0006002 80 0,00 0,00CX
PASTA SUSPENSA marmorizada com visor plastico. 0006003 200 0,00 0,00UN
0,00Valor Total:
DIRETOR
JOAO TESTE
111.222.333-44
DIRETOR
`;

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createPdfBuffer(lines: string[]) {
  const contentStream = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    ...lines.flatMap((line, index) => [
      index === 0 ? "" : "0 -16 Td",
      `(${escapePdfText(line)}) Tj`,
    ]),
    "ET",
  ]
    .filter(Boolean)
    .join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, "latin1")} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  const xrefEntries = offsets
    .map((offset, index) =>
      index === 0 ? "0000000000 65535 f " : `${String(offset).padStart(10, "0")} 00000 n `,
    )
    .join("\n");

  pdf += `xref\n0 ${offsets.length}\n${xrefEntries}\n`;
  pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

const PUREZA_EXPENSE_REQUEST_PDF = createPdfBuffer([
  "PRACA 05 DE ABRIL, 180, CENTRO, PUREZA/RN CEP: 59582000",
  "CNPJ: 08.290.223/0001-42",
  "Solicitacao de",
  "Despesa",
  "MUNICIPIO DE PUREZA",
  "Unidade Orcamentaria: 06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer",
  "N Solicitacao:",
  "6",
  "Data Emissao:",
  "08/01/2026 10/2026",
  "Processo:",
  "Servico",
  "Classificacao:",
  "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI, para abrilhantar as festividades do Carnaval de Pureza 2026, que sera realizado de 13 a 17 de fevereiro.",
  "Objeto:",
  "O Municipio de Pureza/RN realizara, no periodo de 13 a 17 de fevereiro de 2026, o Carnaval de Pureza 2026.",
  "A programacao carnavalesca tem como finalidade promover o acesso a cultura.",
  "Justificativa:",
  "Item Descricao Qtd. Und Vlr. Unitario Vlr. TotalLote FatorQtd.Ini",
  "apresentacao artistica musical da banda FORRO TSUNAMI, para abrilhantar as festividades do Carnaval de Pureza 2026, que sera realizado de 13 a 17 de fevereiro, com duracao de 02 horas de show.",
  "0005091  1  0,00  0,00SERVICO",
  "0,00Valor Total:",
  "SECRETARIO DE EDUCACAO, CULTURA, ESPORTE E LAZER",
  "MARIA MARILDA SILVA DA ROCHA",
  "878.541.554-53",
  "SECRETARIO DE EDUCACAO, CULTURA, ESPORTE E LAZER",
]);

function createOrganizationRow(
  overrides: Partial<typeof organizations.$inferSelect> = {},
): typeof organizations.$inferSelect {
  return {
    id: ORGANIZATION_ID,
    name: "Prefeitura de Exemplo",
    slug: "prefeitura-de-exemplo",
    officialName: "Prefeitura Municipal de Exemplo",
    cnpj: "12.345.678/0001-99",
    city: "Exemplo",
    state: "CE",
    address: "Rua Principal, 100",
    zipCode: "60000-000",
    phone: "(85) 3333-0000",
    institutionalEmail: "contato@exemplo.ce.gov.br",
    website: null,
    logoUrl: null,
    authorityName: "Maria Silva",
    authorityRole: "Prefeita",
    isActive: true,
    createdByUserId: "admin_user",
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createProcessRow(
  overrides: Partial<typeof processes.$inferSelect> = {},
): typeof processes.$inferSelect {
  return {
    id: PROCESS_ID,
    organizationId: ORGANIZATION_ID,
    type: "inexigibilidade",
    procurementMethod: "inexigibilidade",
    biddingModality: null,
    processNumber: "2026-001",
    externalId: null,
    issuedAt: new Date("2026-01-08T00:00:00.000Z"),
    title: "Apresentacao artistica",
    object: "Contratacao de apresentacao artistica",
    justification: "Atender evento cultural do municipio",
    responsibleName: "Ana Souza",
    responsibleUserId: "user_responsible",
    status: "draft",
    sourceKind: null,
    sourceReference: null,
    sourceMetadata: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createDepartmentRow(
  overrides: Partial<typeof departments.$inferSelect> = {},
): typeof departments.$inferSelect {
  return {
    id: DEPARTMENT_ID,
    organizationId: ORGANIZATION_ID,
    name: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
    slug: "sec-mun-de-educ-cultura-esporte-e-lazer",
    budgetUnitCode: "06.001",
    responsibleName: "Maria Marilda Silva da Rocha",
    responsibleRole: "Secretaria",
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createDocumentRow(
  overrides: Partial<typeof documents.$inferSelect> = {},
): typeof documents.$inferSelect {
  return {
    id: DOCUMENT_ID,
    organizationId: ORGANIZATION_ID,
    processId: PROCESS_ID,
    name: "Documento exemplo",
    type: "attachment",
    status: "completed",
    draftContent: null,
    storageKey: "documents/processo/documento.pdf",
    responsibles: ["Ana Souza"],
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function parseCreateProcessInput(input: Parameters<typeof createProcessBodySchema.parse>[0]) {
  return createProcessBodySchema.parse(input);
}

function parseUpdateProcessInput(input: Parameters<typeof updateProcessBodySchema.parse>[0]) {
  return updateProcessBodySchema.parse(input);
}

test("process schemas canonicalize payloads and reject invalid updates", () => {
  const parsed = parseCreateProcessInput({
    type: "  inexigibilidade  ",
    processNumber: "  2026/001  ",
    externalId: "   ",
    issuedAt: "2026-01-08",
    object: "  Contratacao de apresentacao artistica  ",
    justification: "  Atender evento cultural  ",
    responsibleName: "  Ana Souza  ",
    departmentIds: [DEPARTMENT_ID, DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
  });

  assert.deepEqual(parsed, {
    type: "inexigibilidade",
    processNumber: "2026/001",
    externalId: null,
    issuedAt: "2026-01-08T00:00:00.000Z",
    title: null,
    object: "Contratacao de apresentacao artistica",
    justification: "Atender evento cultural",
    responsibleName: "Ana Souza",
    sourceKind: null,
    sourceReference: null,
    status: "draft",
    departmentIds: [DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
  });

  assert.equal(
    parseCreateProcessInput({
      type: "inexigibilidade",
      processNumber: "2026/002",
      issuedAt: "2026-01-08",
      title: "  Titulo enxuto  ",
      object: "Contratacao de apresentacao artistica",
      justification: "Atender evento cultural",
      responsibleName: "Ana Souza",
      departmentIds: [DEPARTMENT_ID],
    }).title,
    "Titulo enxuto",
  );

  assert.equal(
    updateProcessBodySchema.safeParse({
      departmentIds: [],
    }).success,
    false,
  );

  assert.equal(
    updateProcessBodySchema.safeParse({
      organizationId: OTHER_ORGANIZATION_ID,
    }).success,
    false,
  );
});

test("deriveConciseProcessTitle prefers explicit and source-aware concise values", () => {
  assert.equal(
    deriveConciseProcessTitle({
      title: "  Titulo revisado  ",
      object: "Contratacao de empresa especializada para prestacao de servicos tecnicos",
    }),
    "Titulo revisado",
  );
  assert.equal(
    deriveConciseProcessTitle({
      itemDescription:
        "apresentacao artistica musical da banda FORRO TSUNAMI, para abrilhantar as festividades do Carnaval de Pureza 2026",
      object:
        "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI, para abrilhantar as festividades do Carnaval de Pureza 2026",
    }),
    "Apresentacao artistica musical da banda FORRO TSUNAMI",
  );
  assert.equal(
    deriveConciseProcessTitle({
      object:
        "Contratacao de empresa especializada para prestacao de servicos tecnicos de assessoria e suporte em Recursos Humanos, de execucao indireta, junto aos Orgaos Federais",
    }),
    "Prestacao de servicos tecnicos de assessoria e suporte em Recursos Humanos",
  );
});

test("parseExpenseRequestText extracts process context from Top Down SD text", () => {
  const parsed = parseExpenseRequestText(PUREZA_EXPENSE_REQUEST_TEXT);

  assert.equal(parsed.organizationCnpj, "08.290.223/0001-42");
  assert.equal(parsed.budgetUnitCode, "06.001");
  assert.equal(parsed.budgetUnitName, "Sec.Mun.de Educ,Cultura, Esporte e Lazer");
  assert.equal(parsed.requestNumber, "6");
  assert.equal(parsed.issueDate, "2026-01-08T00:00:00.000Z");
  assert.equal(parsed.processType, "Servico");
  assert.match(parsed.object, /FORRO TSUNAMI/);
  assert.match(parsed.justification, /Carnaval de Pureza 2026/);
  assert.match(parsed.item.description ?? "", /apresentacao artistica/);
  assert.equal(parsed.item.code, "0005091");
  assert.equal(parsed.responsibleName, "MARIA MARILDA SILVA DA ROCHA");
  assert.equal(parsed.sourceReference, "SD-6-2026");
});

test("parseExpenseRequestText keeps kit SDs on the legacy representative item path", () => {
  const parsed = parseExpenseRequestText(KIT_ESCOLAR_EXPENSE_REQUEST_TEXT);

  assert.equal("items" in parsed, false);
  assert.equal("itemStructureDiagnostics" in parsed, false);
  assert.equal(parsed.item.code, "0005113");
  assert.equal(parsed.item.quantity, "550");
  assert.equal(parsed.item.unit, "KIT");
});

test("parseExpenseRequestText keeps multi-page kit SDs on the legacy representative item path", () => {
  const parsed = parseExpenseRequestText(KIT_ESCOLAR_WITH_PAGE_HEADERS_EXPENSE_REQUEST_TEXT);

  assert.equal("items" in parsed, false);
  assert.equal("itemStructureDiagnostics" in parsed, false);
  assert.equal(parsed.item.code, "0005113");
  assert.equal(parsed.item.quantity, "550");
  assert.equal(parsed.item.unit, "KIT");
});

test("parseExpenseRequestText keeps non-kit multi-item rows on the legacy representative item path", () => {
  const parsed = parseExpenseRequestText(MULTI_ITEM_EXPENSE_REQUEST_TEXT);

  assert.equal("items" in parsed, false);
  assert.equal("itemStructureDiagnostics" in parsed, false);
  assert.equal(parsed.item.code, "0006001");
  assert.equal(parsed.item.quantity, "120");
  assert.equal(parsed.item.unit, "RESMA");
});

test("parseExpenseRequestText rejects missing required fields and warns on optional fields", () => {
  assert.throws(() => parseExpenseRequestText(""), BadRequestError);
  assert.throws(
    () =>
      parseExpenseRequestText(`
        Unidade Orcamentaria: Secretaria Municipal
        Processo:
        Servico
        Classificacao:
        Contratacao de servico
        Objeto:
        Necessidade administrativa
      `),
    BadRequestError,
  );

  const parsed = parseExpenseRequestText(
    PUREZA_EXPENSE_REQUEST_TEXT.replace("CNPJ: 08.290.223/0001-42", "").replace("06.001 - ", ""),
  );

  assert.ok(parsed.warnings.includes("organization_cnpj_missing"));
  assert.ok(parsed.warnings.includes("budget_unit_code_missing"));
});

test("extractTextFromPdf reads machine-readable text and rejects password-protected PDFs", async () => {
  const text = await extractTextFromPdf(PUREZA_EXPENSE_REQUEST_PDF);

  assert.match(text, /CNPJ: 08.290.223\/0001-42/);
  assert.match(text, /N Solicitacao:/);

  await assert.rejects(
    () =>
      extractTextFromPdf(Buffer.from("pdf"), () => ({
        promise: Promise.reject({ name: "PasswordException" }),
      })),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "Password-protected PDFs are not supported.",
  );
});

test("normalizeExpenseRequestPdfUpload validates file presence, file type, and file size", async () => {
  await assert.rejects(
    () =>
      normalizeExpenseRequestPdfUpload({
        body: {},
        maxBytes: 3 * 1024 * 1024,
      }),
    BadRequestError,
  );

  await assert.rejects(
    () =>
      normalizeExpenseRequestPdfUpload({
        body: {
          file: {
            type: "file",
            fieldname: "file",
            filename: "sd.txt",
            mimetype: "text/plain",
            toBuffer: async () => Buffer.from("text"),
          },
        },
        maxBytes: 3 * 1024 * 1024,
      }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "Expense request upload must be a PDF file.",
  );

  await assert.rejects(
    () =>
      normalizeExpenseRequestPdfUpload({
        body: {
          file: {
            type: "file",
            fieldname: "file",
            filename: "sd.pdf",
            mimetype: "application/pdf",
            toBuffer: async () => Buffer.alloc(3 * 1024 * 1024 + 1),
          },
        },
        maxBytes: 3 * 1024 * 1024,
      }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "Expense request PDF must be 3 MB or smaller.",
  );
});

test("createProcess lets admins create for any organization and links departments", async () => {
  let insertedProcessValues: Record<string, unknown> | undefined;
  let insertedDepartmentLinks: Array<typeof processDepartments.$inferInsert> | undefined;

  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: DEPARTMENT_ID }, { id: SECOND_DEPARTMENT_ID }];
          }

          return [];
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        if (table === processes) {
          const nextValues = values as Record<string, unknown>;
          insertedProcessValues = nextValues;

          return {
            returning: async () => [
              createProcessRow({
                organizationId: String(nextValues.organizationId),
                type: String(nextValues.type),
                processNumber: String(nextValues.processNumber),
                externalId: nextValues.externalId as string | null,
                issuedAt: nextValues.issuedAt as Date,
                title: String(nextValues.title),
                object: String(nextValues.object),
                justification: String(nextValues.justification),
                responsibleName: String(nextValues.responsibleName),
                status: String(nextValues.status),
              }),
            ],
          };
        }

        insertedDepartmentLinks = values as Array<typeof processDepartments.$inferInsert>;

        return {
          returning: async () => [],
        };
      },
    }),
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcess({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    process: parseCreateProcessInput({
      type: "inexigibilidade",
      processNumber: "2026/001",
      externalId: "externo-123",
      organizationId: ORGANIZATION_ID,
      issuedAt: "2026-01-08",
      object: "Contratacao de apresentacao artistica",
      justification: "Atender evento cultural do municipio",
      responsibleName: "Ana Souza",
      departmentIds: [DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
    }),
  });

  assert.equal(insertedProcessValues?.organizationId, ORGANIZATION_ID);
  assert.equal(insertedProcessValues?.processNumber, "2026/001");
  assert.equal(insertedProcessValues?.externalId, "externo-123");
  assert.equal(insertedProcessValues?.title, "Apresentacao artistica");
  assert.ok(insertedProcessValues?.issuedAt instanceof Date);
  assert.deepEqual(insertedDepartmentLinks, [
    { processId: PROCESS_ID, departmentId: DEPARTMENT_ID },
    { processId: PROCESS_ID, departmentId: SECOND_DEPARTMENT_ID },
  ]);
  assert.equal(response.organizationId, ORGANIZATION_ID);
  assert.equal(response.title, "Apresentacao artistica");
  assert.deepEqual(response.departmentIds, [DEPARTMENT_ID, SECOND_DEPARTMENT_ID]);
});

test("createProcess preserves native expense request item and kit metadata", async () => {
  let insertedProcessValues: Record<string, unknown> | undefined;
  const nativeSourceMetadata = {
    extractedFields: {
      item: {
        kind: "simple",
        title: "Pote plastico",
        quantity: "10",
        unit: "unidade",
        unitValue: "R$ 8,00",
        totalValue: "R$ 80,00",
      },
      items: [
        {
          kind: "simple",
          title: "Pote plastico",
          quantity: "10",
          unit: "unidade",
          unitValue: "R$ 8,00",
          totalValue: "R$ 80,00",
        },
        {
          kind: "kit",
          title: "Kit escolar",
          quantity: "100",
          unit: "kit",
          components: [
            {
              title: "Caderno",
              description: "Caderno brochura capa dura",
              quantity: "2",
              unit: "unidade",
            },
          ],
        },
      ],
    },
    source: {
      inputMode: "native_form",
    },
    warnings: [],
  };

  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: DEPARTMENT_ID }];
          }

          return [];
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        if (table === processes) {
          const nextValues = values as Record<string, unknown>;
          insertedProcessValues = nextValues;

          return {
            returning: async () => [
              createProcessRow({
                organizationId: String(nextValues.organizationId),
                sourceKind: nextValues.sourceKind as string | null,
                sourceMetadata: nextValues.sourceMetadata as Record<string, unknown>,
              }),
            ],
          };
        }

        return {
          returning: async () => [],
        };
      },
    }),
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcess({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    process: parseCreateProcessInput({
      type: "pregao",
      processNumber: "PROC-NATIVE-ITEMS",
      issuedAt: "2026-01-08",
      object: "Aquisicao de itens nativos",
      justification: "Atendimento da demanda.",
      responsibleName: "Ana Souza",
      departmentIds: [DEPARTMENT_ID],
      sourceKind: "expense_request",
      sourceReference: "PROC-NATIVE-ITEMS",
      sourceMetadata: nativeSourceMetadata,
    }),
  });

  assert.deepEqual(insertedProcessValues?.sourceMetadata, nativeSourceMetadata);
  assert.equal("sourceMetadata" in response, false);
  assert.ok(JSON.stringify(response.items).includes("Kit escolar"));
  assert.ok(JSON.stringify(response.items).includes("Caderno brochura"));
});

test("createProcess scopes members to their own organization and rejects foreign departments", async () => {
  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: DEPARTMENT_ID }];
          }

          return [];
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: () => {
        if (table === processes) {
          return {
            returning: async () => [createProcessRow()],
          };
        }

        return {
          returning: async () => [],
        };
      },
    }),
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcess({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    process: parseCreateProcessInput({
      type: "inexigibilidade",
      processNumber: "2026/001",
      organizationId: ORGANIZATION_ID,
      issuedAt: "2026-01-08",
      object: "Contratacao de apresentacao artistica",
      justification: "Atender evento cultural do municipio",
      responsibleName: "Ana Souza",
      departmentIds: [DEPARTMENT_ID],
    }),
  });

  assert.equal(response.organizationId, ORGANIZATION_ID);

  const failingDb = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createProcess({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: failingDb,
        process: parseCreateProcessInput({
          type: "inexigibilidade",
          processNumber: "2026/002",
          issuedAt: "2026-01-08",
          object: "Contratacao de apresentacao artistica",
          justification: "Atender evento cultural do municipio",
          responsibleName: "Ana Souza",
          departmentIds: [DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
        }),
      }),
    BadRequestError,
  );
});

test("createProcessFromExpenseRequest creates scoped process from SD text", async () => {
  let insertedProcessValues: Record<string, unknown> | undefined;
  let insertedDepartmentLinks: Array<typeof processDepartments.$inferInsert> | undefined;
  const department = createDepartmentRow();
  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: DEPARTMENT_ID }];
          }

          return [];
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        if (table === processes) {
          const nextValues = values as Record<string, unknown>;
          insertedProcessValues = nextValues;

          return {
            returning: async () => [
              createProcessRow({
                organizationId: String(nextValues.organizationId),
                type: String(nextValues.type),
                processNumber: String(nextValues.processNumber),
                externalId: nextValues.externalId as string | null,
                issuedAt: nextValues.issuedAt as Date,
                title: String(nextValues.title),
                object: String(nextValues.object),
                justification: String(nextValues.justification),
                responsibleName: String(nextValues.responsibleName),
                status: String(nextValues.status),
                sourceKind: nextValues.sourceKind as string | null,
                sourceReference: nextValues.sourceReference as string | null,
                sourceMetadata: nextValues.sourceMetadata as Record<string, unknown> | null,
              }),
            ],
          };
        }

        insertedDepartmentLinks = values as Array<typeof processDepartments.$inferInsert>;

        return {
          returning: async () => [],
        };
      },
    }),
  };
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
      departments: {
        findMany: async () => [department],
      },
    },
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcessFromExpenseRequest({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    request: {
      expenseRequestText: PUREZA_EXPENSE_REQUEST_TEXT,
      sourceLabel: "SD.pdf",
      fileName: "SD.pdf",
    },
  });

  assert.equal(insertedProcessValues?.processNumber, "SD-6-2026");
  assert.equal(insertedProcessValues?.externalId, "6");
  assert.equal(
    insertedProcessValues?.title,
    "Apresentacao artistica musical da banda FORRO TSUNAMI",
  );
  assert.equal(insertedProcessValues?.sourceKind, "expense_request");
  assert.equal(insertedProcessValues?.sourceReference, "SD-6-2026");
  assert.deepEqual(insertedDepartmentLinks, [
    { processId: PROCESS_ID, departmentId: DEPARTMENT_ID },
  ]);
  assert.equal(response.processNumber, "SD-6-2026");
  assert.equal(response.title, "Apresentacao artistica musical da banda FORRO TSUNAMI");
  assert.equal("sourceKind" in response, false);
  assert.equal("sourceMetadata" in response, false);
});

test("createProcessFromExpenseRequestText persists source file traceability when provided", async () => {
  let insertedProcessValues: Record<string, unknown> | undefined;
  const department = createDepartmentRow();
  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ id: DEPARTMENT_ID }],
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        if (table === processes) {
          insertedProcessValues = values as Record<string, unknown>;

          return {
            returning: async () => [
              createProcessRow({
                externalId: (values as Record<string, unknown>).externalId as string | null,
                issuedAt: (values as Record<string, unknown>).issuedAt as Date,
                justification: String((values as Record<string, unknown>).justification),
                title: String((values as Record<string, unknown>).title),
                object: String((values as Record<string, unknown>).object),
                processNumber: String((values as Record<string, unknown>).processNumber),
                responsibleName: String((values as Record<string, unknown>).responsibleName),
                sourceKind: "expense_request",
                sourceReference: "SD-6-2026",
                sourceMetadata: (values as Record<string, unknown>).sourceMetadata as Record<
                  string,
                  unknown
                >,
                status: String((values as Record<string, unknown>).status),
                type: String((values as Record<string, unknown>).type),
              }),
            ],
          };
        }

        return {
          returning: async () => [],
        };
      },
    }),
  };
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
      departments: {
        findMany: async () => [department],
      },
    },
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcessFromExpenseRequestText({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    input: {
      expenseRequestText: PUREZA_EXPENSE_REQUEST_TEXT,
      fileName: "SD.pdf",
      sourceLabel: "SD.pdf",
      sourceFile: {
        bucket: "licitadoc-expense-requests",
        contentType: "application/pdf",
        etag: "etag-1",
        key: "expense-requests/2026/04/sd.pdf",
        sizeBytes: 2048,
        uploadedAt: "2026-04-21T12:00:00.000Z",
      },
    },
  });

  const sourceMetadata = insertedProcessValues?.sourceMetadata as Record<string, unknown>;
  assert.ok(sourceMetadata);
  assert.equal("sourceKind" in response, false);
  assert.deepEqual((sourceMetadata.sourceFile ?? null) as Record<string, unknown>, {
    contentType: "application/pdf",
    etag: "etag-1",
    fileName: "SD.pdf",
    sizeBytes: 2048,
    storageBucket: "licitadoc-expense-requests",
    storageKey: "expense-requests/2026/04/sd.pdf",
    uploadedAt: "2026-04-21T12:00:00.000Z",
  });
});

test("createProcessFromExpenseRequestPdf uploads first, creates process, and cleans up on failure", async () => {
  const storedObject = {
    bucket: "licitadoc-expense-requests",
    contentType: "application/pdf",
    etag: "etag-1",
    key: "expense-requests/2026/04/sd.pdf",
    sizeBytes: PUREZA_EXPENSE_REQUEST_PDF.byteLength,
    uploadedAt: "2026-04-21T12:00:00.000Z",
  };
  const deletedObjects: Array<{ bucket: string; key: string }> = [];
  let storedCalls = 0;
  let insertedProcessValues: Record<string, unknown> | undefined;
  const department = createDepartmentRow();
  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ id: DEPARTMENT_ID }],
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        if (table === processes) {
          insertedProcessValues = values as Record<string, unknown>;

          return {
            returning: async () => [
              createProcessRow({
                externalId: (values as Record<string, unknown>).externalId as string | null,
                issuedAt: (values as Record<string, unknown>).issuedAt as Date,
                justification: String((values as Record<string, unknown>).justification),
                title: String((values as Record<string, unknown>).title),
                object: String((values as Record<string, unknown>).object),
                processNumber: String((values as Record<string, unknown>).processNumber),
                responsibleName: String((values as Record<string, unknown>).responsibleName),
                sourceKind: "expense_request",
                sourceReference: "SD-6-2026",
                sourceMetadata: (values as Record<string, unknown>).sourceMetadata as Record<
                  string,
                  unknown
                >,
                status: String((values as Record<string, unknown>).status),
                type: String((values as Record<string, unknown>).type),
              }),
            ],
          };
        }

        return {
          returning: async () => [],
        };
      },
    }),
  };
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
      departments: {
        findMany: async () => [department],
      },
    },
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];
  const storage: FileStorageProvider = {
    deleteObject: async (object) => {
      deletedObjects.push(object);
    },
    storeExpenseRequestPdf: async () => {
      storedCalls += 1;
      return storedObject;
    },
  };

  const response = await createProcessFromExpenseRequestPdf({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    input: {
      buffer: PUREZA_EXPENSE_REQUEST_PDF,
      contentType: "application/pdf",
      fileName: "SD.pdf",
      sourceLabel: "SD.pdf",
    },
    storage,
  });

  assert.equal(storedCalls, 1);
  assert.equal(deletedObjects.length, 0);
  assert.equal(response.processNumber, "SD-6-2026");
  assert.deepEqual(
    ((insertedProcessValues?.sourceMetadata as Record<string, unknown>).sourceFile ??
      null) as Record<string, unknown>,
    {
      contentType: "application/pdf",
      etag: "etag-1",
      fileName: "SD.pdf",
      sizeBytes: PUREZA_EXPENSE_REQUEST_PDF.byteLength,
      storageBucket: "licitadoc-expense-requests",
      storageKey: "expense-requests/2026/04/sd.pdf",
      uploadedAt: "2026-04-21T12:00:00.000Z",
    },
  );

  await assert.rejects(
    () =>
      createProcessFromExpenseRequestPdf({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db,
        input: {
          buffer: createPdfBuffer([]),
          contentType: "application/pdf",
          fileName: "empty.pdf",
        },
        storage,
      }),
    BadRequestError,
  );

  assert.deepEqual(deletedObjects.at(-1), {
    bucket: "licitadoc-expense-requests",
    key: "expense-requests/2026/04/sd.pdf",
  });
});

test("createProcessFromExpenseRequestPdf reuses scope rules and stops when storage fails", async () => {
  const rejectingStorage: FileStorageProvider = {
    deleteObject: async () => undefined,
    storeExpenseRequestPdf: async () => {
      throw new Error("storage down");
    },
  };

  await assert.rejects(
    () =>
      createProcessFromExpenseRequestPdf({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: {
          query: {},
        } as FastifyInstance["db"],
        input: {
          buffer: PUREZA_EXPENSE_REQUEST_PDF,
          contentType: "application/pdf",
          fileName: "SD.pdf",
        },
        storage: rejectingStorage,
      }),
    /storage down/,
  );

  const department = createDepartmentRow();
  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "99.999.999/0001-99" }),
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ id: DEPARTMENT_ID }],
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: async () => [createProcessRow()],
      }),
    }),
  };
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "99.999.999/0001-99" }),
      },
      departments: {
        findMany: async () => [department],
      },
    },
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];
  const storage: FileStorageProvider = {
    deleteObject: async () => undefined,
    storeExpenseRequestPdf: async () => ({
      bucket: "licitadoc-expense-requests",
      contentType: "application/pdf",
      etag: "etag-1",
      key: "expense-requests/2026/04/sd.pdf",
      sizeBytes: PUREZA_EXPENSE_REQUEST_PDF.byteLength,
      uploadedAt: "2026-04-21T12:00:00.000Z",
    }),
  };

  await assert.rejects(
    () =>
      createProcessFromExpenseRequestPdf({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db,
        input: {
          buffer: PUREZA_EXPENSE_REQUEST_PDF,
          contentType: "application/pdf",
          fileName: "SD.pdf",
        },
        storage,
      }),
    ForbiddenError,
  );
});

test("createProcessFromExpenseRequest resolves admin organization by CNPJ", async () => {
  const department = createDepartmentRow();
  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ id: DEPARTMENT_ID }],
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        if (table === processes) {
          return {
            returning: async () => [
              createProcessRow({
                ...(values as Record<string, unknown>),
                issuedAt: (values as Record<string, unknown>).issuedAt as Date,
              }),
            ],
          };
        }

        return {
          returning: async () => [],
        };
      },
    }),
  };
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
      departments: {
        findMany: async () => [department],
      },
    },
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcessFromExpenseRequest({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    request: {
      expenseRequestText: PUREZA_EXPENSE_REQUEST_TEXT,
      sourceLabel: null,
      fileName: null,
    },
  });

  assert.equal(response.organizationId, ORGANIZATION_ID);
});

test("createProcessFromExpenseRequest rejects scoped and department resolution failures", async () => {
  const baseDb = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "95.100.000/0001-00" }),
      },
      departments: {
        findMany: async () => [createDepartmentRow()],
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createProcessFromExpenseRequest({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: baseDb,
        request: {
          expenseRequestText: PUREZA_EXPENSE_REQUEST_TEXT,
          sourceLabel: null,
          fileName: null,
        },
      }),
    ForbiddenError,
  );

  const missingDepartmentDb = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
      departments: {
        findMany: async () => [],
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createProcessFromExpenseRequest({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: missingDepartmentDb,
        request: {
          expenseRequestText: PUREZA_EXPENSE_REQUEST_TEXT,
          sourceLabel: null,
          fileName: null,
        },
      }),
    BadRequestError,
  );

  const ambiguousDepartmentDb = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
      departments: {
        findMany: async () => [
          createDepartmentRow(),
          createDepartmentRow({
            id: SECOND_DEPARTMENT_ID,
            slug: "second-department",
          }),
        ],
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createProcessFromExpenseRequest({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: ambiguousDepartmentDb,
        request: {
          expenseRequestText: PUREZA_EXPENSE_REQUEST_TEXT,
          sourceLabel: null,
          fileName: null,
        },
      }),
    BadRequestError,
  );

  const crossDepartmentDb = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow({ cnpj: "08.290.223/0001-42" }),
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ id: DEPARTMENT_ID }],
      }),
    }),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createProcessFromExpenseRequest({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: crossDepartmentDb,
        request: {
          expenseRequestText: PUREZA_EXPENSE_REQUEST_TEXT,
          sourceLabel: null,
          fileName: null,
          departmentIds: [DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
        },
      }),
    BadRequestError,
  );
});

test("getProcesses returns paginated processes for admins and empty page without organization", async () => {
  let capturedListWhere: unknown;
  let capturedLimit: number | undefined;
  let capturedOffset: number | undefined;

  const db = {
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === processes) {
            return [{ total: 3 }];
          }

          if (table === documents) {
            return [
              createDocumentRow({
                processId: PROCESS_ID,
                type: "dfd",
                status: "completed",
                updatedAt: new Date("2029-12-03T00:00:00.000Z"),
              }),
              createDocumentRow({
                processId: PROCESS_ID,
                type: "etp",
                status: "failed",
                updatedAt: new Date("2029-12-04T00:00:00.000Z"),
              }),
            ];
          }

          return [
            { processId: PROCESS_ID, departmentId: DEPARTMENT_ID },
            { processId: PROCESS_ID, departmentId: SECOND_DEPARTMENT_ID },
          ];
        },
      }),
    }),
    query: {
      processes: {
        findMany: async (options?: { where?: unknown; limit?: number; offset?: number }) => {
          capturedListWhere = options?.where;
          capturedLimit = options?.limit;
          capturedOffset = options?.offset;

          return [createProcessRow()];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const adminResponse = await getProcesses({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    page: 2,
    pageSize: 2,
  });

  assert.equal(capturedListWhere, undefined);
  assert.equal(capturedLimit, 2);
  assert.equal(capturedOffset, 2);
  assert.equal(adminResponse.total, 3);
  assert.equal(adminResponse.totalPages, 2);
  assert.deepEqual(adminResponse.items[0]?.departmentIds, [SECOND_DEPARTMENT_ID, DEPARTMENT_ID]);
  assert.deepEqual(adminResponse.items[0]?.documents, {
    completedCount: 1,
    totalRequiredCount: 4,
    completedTypes: ["dfd"],
    missingTypes: ["etp", "tr", "minuta"],
  });
  assert.equal(adminResponse.items[0]?.updatedAt, "2029-12-01T00:00:00.000Z");
  assert.equal(adminResponse.items[0]?.listUpdatedAt, "2029-12-04T00:00:00.000Z");

  const emptyResponse = await getProcesses({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: null,
    },
    db: {} as FastifyInstance["db"],
  });

  assert.deepEqual(emptyResponse.items, []);
  assert.equal(emptyResponse.total, 0);
  assert.equal(emptyResponse.totalPages, 0);
});

test("getProcesses applies listing filters and aggregates completed document types once", async () => {
  let capturedListWhere: unknown;
  let capturedCountWhere: unknown;
  const documentRows = [
    createDocumentRow({
      processId: PROCESS_ID,
      type: "dfd",
      status: "completed",
      updatedAt: new Date("2029-12-03T00:00:00.000Z"),
    }),
    createDocumentRow({
      processId: PROCESS_ID,
      type: "dfd",
      status: "completed",
      updatedAt: new Date("2029-12-04T00:00:00.000Z"),
    }),
    createDocumentRow({
      processId: PROCESS_ID,
      type: "etp",
      status: "completed",
      updatedAt: new Date("2029-12-05T00:00:00.000Z"),
    }),
    createDocumentRow({
      processId: PROCESS_ID,
      type: "tr",
      status: "failed",
      updatedAt: new Date("2029-12-06T00:00:00.000Z"),
    }),
    createDocumentRow({
      processId: PROCESS_ID,
      type: "attachment",
      status: "completed",
      updatedAt: new Date("2029-12-07T00:00:00.000Z"),
    }),
  ];

  const db = {
    select: () => ({
      from: (table: unknown) => ({
        where: async (where?: unknown) => {
          if (table === processes) {
            capturedCountWhere = where;

            return [{ total: 1 }];
          }

          if (table === documents) {
            return documentRows;
          }

          return [{ processId: PROCESS_ID, departmentId: DEPARTMENT_ID }];
        },
      }),
    }),
    query: {
      processes: {
        findMany: async (options?: { where?: unknown }) => {
          capturedListWhere = options?.where;

          return [
            createProcessRow({
              processNumber: "PROC-SEARCH-001",
              externalId: "EXT-SEARCH-001",
              object: "Aquisicao de material permanente",
              responsibleName: "Maria Costa",
              status: "em_edicao",
              type: "pregao-eletronico",
              updatedAt: new Date("2029-12-02T00:00:00.000Z"),
            }),
          ];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getProcesses({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    search: "material",
    status: "em_edicao",
    procurementMethod: "pregao-eletronico",
  });

  assert.ok(capturedCountWhere);
  assert.ok(capturedListWhere);
  assert.deepEqual(response.items[0]?.documents, {
    completedCount: 2,
    totalRequiredCount: 4,
    completedTypes: ["dfd", "etp"],
    missingTypes: ["tr", "minuta"],
  });
  assert.equal(response.items[0]?.listUpdatedAt, "2029-12-07T00:00:00.000Z");
});

test("getProcess allows admins and rejects members outside organization", async () => {
  const db = {
    query: {
      processes: {
        findFirst: async () =>
          createProcessRow({
            organizationId: OTHER_ORGANIZATION_ID,
            title: null,
            object:
              "Contratacao de empresa especializada para prestacao de servicos tecnicos de assessoria e suporte em Recursos Humanos, de execucao indireta",
          }),
      },
      departments: {
        findMany: async () => [],
      },
      documents: {
        findMany: async () => [],
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ departmentId: DEPARTMENT_ID }],
      }),
    }),
  } as unknown as FastifyInstance["db"];

  const response = await getProcess({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    processId: PROCESS_ID,
  });

  assert.equal(response.organizationId, OTHER_ORGANIZATION_ID);
  assert.equal(
    response.title,
    "Prestacao de servicos tecnicos de assessoria e suporte em Recursos Humanos",
  );
  assert.deepEqual(response.departments, []);
  assert.equal(response.summary.estimatedTotalValue, null);
  assert.deepEqual(response.documents, [
    {
      type: "dfd",
      label: "DFD",
      title: "Documento de Formalização de Demanda",
      description: "Justificativa da necessidade de contratação",
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
      type: "etp",
      label: "ETP",
      title: "Estudo Técnico Preliminar",
      description: "Análise técnica e levantamento de soluções",
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
  ]);
  assert.equal(response.detailUpdatedAt, "2029-12-01T00:00:00.000Z");

  await assert.rejects(
    () =>
      getProcess({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db,
        processId: PROCESS_ID,
      }),
    ForbiddenError,
  );
});

test("getProcess returns enriched detail data and keeps base fields compatible", async () => {
  const dfdDocumentId = "6a6a6a6a-e2e5-4876-b4c3-b35306c6e733";
  const etpDocumentId = "5a5a5a5a-e2e5-4876-b4c3-b35306c6e733";
  const failedEtpDocumentId = "4a4a4a4a-e2e5-4876-b4c3-b35306c6e733";
  const minutaDocumentId = "3a3a3a3a-e2e5-4876-b4c3-b35306c6e733";
  const process = createProcessRow({
    sourceMetadata: {
      extractedFields: {
        totalValue: "R$ 450.000,00",
      },
    },
    updatedAt: new Date("2029-12-02T00:00:00.000Z"),
  });
  const departmentRows = [
    createDepartmentRow({
      updatedAt: new Date("2029-12-03T00:00:00.000Z"),
    }),
    createDepartmentRow({
      id: SECOND_DEPARTMENT_ID,
      name: "Departamento de Tecnologia",
      budgetUnitCode: null,
      updatedAt: new Date("2029-12-04T00:00:00.000Z"),
    }),
  ];
  const documentRows = [
    createDocumentRow({
      id: dfdDocumentId,
      type: "dfd",
      status: "completed",
      updatedAt: new Date("2029-12-05T00:00:00.000Z"),
    }),
    createDocumentRow({
      id: etpDocumentId,
      type: "etp",
      status: "generating",
      updatedAt: new Date("2029-12-06T00:00:00.000Z"),
    }),
    createDocumentRow({
      id: failedEtpDocumentId,
      type: "etp",
      status: "failed",
      updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    }),
    createDocumentRow({
      id: minutaDocumentId,
      type: "minuta",
      status: "failed",
      updatedAt: new Date("2029-12-07T00:00:00.000Z"),
    }),
    createDocumentRow({
      id: "2a2a2a2a-e2e5-4876-b4c3-b35306c6e733",
      type: "attachment",
      status: "completed",
      updatedAt: new Date("2029-12-08T00:00:00.000Z"),
    }),
  ];
  const db = {
    query: {
      processes: {
        findFirst: async () => process,
      },
      departments: {
        findMany: async () => departmentRows,
      },
      documents: {
        findMany: async () => documentRows,
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [
          { departmentId: DEPARTMENT_ID },
          { departmentId: SECOND_DEPARTMENT_ID },
        ],
      }),
    }),
  } as unknown as FastifyInstance["db"];

  const response = await getProcess({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    processId: PROCESS_ID,
  });

  assert.equal(response.processNumber, process.processNumber);
  assert.equal(response.status, process.status);
  assert.equal(response.summary.estimatedTotalValue, "450000.00");
  assert.deepEqual(response.departmentIds, [SECOND_DEPARTMENT_ID, DEPARTMENT_ID]);
  assert.deepEqual(response.departments, [
    {
      id: SECOND_DEPARTMENT_ID,
      organizationId: ORGANIZATION_ID,
      name: "Departamento de Tecnologia",
      budgetUnitCode: null,
      label: "Departamento de Tecnologia",
    },
    {
      id: DEPARTMENT_ID,
      organizationId: ORGANIZATION_ID,
      name: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
      budgetUnitCode: "06.001",
      label: "06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer",
    },
  ]);
  assert.deepEqual(response.documents, [
    {
      type: "dfd",
      label: "DFD",
      title: "Documento de Formalização de Demanda",
      description: "Justificativa da necessidade de contratação",
      status: "concluido",
      documentId: dfdDocumentId,
      lastUpdatedAt: "2029-12-05T00:00:00.000Z",
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
      documentId: etpDocumentId,
      lastUpdatedAt: "2029-12-06T00:00:00.000Z",
      progress: null,
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
      documentId: minutaDocumentId,
      lastUpdatedAt: "2029-12-07T00:00:00.000Z",
      progress: null,
      availableActions: {
        create: false,
        edit: true,
        view: true,
      },
    },
  ]);
  assert.equal(response.detailUpdatedAt, "2029-12-08T00:00:00.000Z");
});

test("updateProcess lets admins and members update fields and department links", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;
  let deletedProcessId: string | undefined;
  let insertedDepartmentLinks: Array<typeof processDepartments.$inferInsert> | undefined;

  const tx = {
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => {
        if (table !== processes) {
          throw new Error("Only processes should be updated.");
        }

        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createProcessRow({
                type: String(values.type ?? "inexigibilidade"),
                processNumber: String(values.processNumber ?? "2026-001"),
                externalId: (values.externalId as string | null | undefined) ?? null,
                issuedAt:
                  (values.issuedAt as Date | undefined) ?? new Date("2026-01-08T00:00:00.000Z"),
                title: String(values.title ?? "Apresentacao artistica"),
                object: String(values.object ?? "Contratacao de apresentacao artistica"),
                justification: String(
                  values.justification ?? "Atender evento cultural do municipio",
                ),
                responsibleName: String(values.responsibleName ?? "Ana Souza"),
                status: String(values.status ?? "draft"),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
    delete: () => ({
      where: async () => {
        deletedProcessId = PROCESS_ID;
      },
    }),
    insert: (table: unknown) => ({
      values: (values: Array<typeof processDepartments.$inferInsert>) => {
        if (table !== processDepartments) {
          throw new Error("Only process department links should be inserted.");
        }

        insertedDepartmentLinks = values;

        return {
          returning: async () => [],
        };
      },
    }),
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: SECOND_DEPARTMENT_ID }];
          }

          return [{ departmentId: DEPARTMENT_ID }];
        },
      }),
    }),
  };

  const linkedDocument = createDocumentRow();

  const db = {
    query: {
      processes: {
        findFirst: async () => createProcessRow(),
      },
      documents: {
        findFirst: async () => linkedDocument,
      },
    },
    select: tx.select,
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const adminResponse = await updateProcess({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    processId: PROCESS_ID,
    changes: parseUpdateProcessInput({
      processNumber: "2026/099",
      externalId: "externo-999",
      title: "Titulo revisado",
      status: "published",
      departmentIds: [SECOND_DEPARTMENT_ID],
    }),
  });

  assert.equal(capturedUpdateValues?.processNumber, "2026/099");
  assert.equal(capturedUpdateValues?.externalId, "externo-999");
  assert.equal(capturedUpdateValues?.title, "Titulo revisado");
  assert.equal(capturedUpdateValues?.status, "published");
  assert.ok(capturedUpdateValues?.updatedAt instanceof Date);
  assert.equal(deletedProcessId, PROCESS_ID);
  assert.deepEqual(insertedDepartmentLinks, [
    { processId: PROCESS_ID, departmentId: SECOND_DEPARTMENT_ID },
  ]);
  assert.equal(adminResponse.processNumber, "2026/099");
  assert.equal(adminResponse.title, "Titulo revisado");
  assert.equal(linkedDocument.processId, PROCESS_ID);

  const memberResponse = await updateProcess({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    processId: PROCESS_ID,
    changes: parseUpdateProcessInput({
      justification: "Nova justificativa",
      departmentIds: [SECOND_DEPARTMENT_ID],
    }),
  });

  assert.equal(memberResponse.justification, "Nova justificativa");
});

test("updateProcess rejects actors outside scope and translates process number conflicts", async () => {
  const forbiddenDb = {
    query: {
      processes: {
        findFirst: async () => createProcessRow({ organizationId: OTHER_ORGANIZATION_ID }),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateProcess({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: forbiddenDb,
        processId: PROCESS_ID,
        changes: parseUpdateProcessInput({
          object: "Novo objeto",
        }),
      }),
    ForbiddenError,
  );

  const conflictDb = {
    query: {
      processes: {
        findFirst: async () => createProcessRow(),
      },
    },
    transaction: async (
      callback: (transaction: {
        update: (table: unknown) => {
          set: (values: Record<string, unknown>) => {
            where: () => {
              returning: () => Promise<never>;
            };
          };
        };
      }) => Promise<unknown> | unknown,
    ) =>
      callback({
        update: () => ({
          set: () => ({
            where: () => ({
              returning: async () => {
                throw {
                  code: "23505",
                  constraint: "processes_organization_process_number_unique",
                };
              },
            }),
          }),
        }),
      }),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateProcess({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db: conflictDb,
        processId: PROCESS_ID,
        changes: parseUpdateProcessInput({
          processNumber: "2026/001",
        }),
      }),
    ConflictError,
  );
});
