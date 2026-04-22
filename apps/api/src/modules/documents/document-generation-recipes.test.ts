import assert from "node:assert/strict";
import { test } from "vitest";
import type { departments, organizations, processes } from "../../db";
import { resolveDocumentGenerationRecipe } from "./document-generation-recipes";
import { buildDfdGenerationContext, buildDocumentGenerationPrompt } from "./documents.shared";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const PROCESS_ID = "1f1f1f1f-e2e5-4876-b4c3-b35306c6e733";
const DEPARTMENT_ID = "9f9f9f9f-e2e5-4876-b4c3-b35306c6e733";

function createOrganizationRow(
  overrides: Partial<typeof organizations.$inferSelect> = {},
): typeof organizations.$inferSelect {
  return {
    id: ORGANIZATION_ID,
    name: "Prefeitura de Exemplo",
    slug: "prefeitura-de-exemplo",
    officialName: "Prefeitura Municipal de Exemplo",
    cnpj: "12.345.678/0001-99",
    city: "Fortaleza",
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

function createDepartmentRow(
  overrides: Partial<typeof departments.$inferSelect> = {},
): typeof departments.$inferSelect {
  return {
    id: DEPARTMENT_ID,
    organizationId: ORGANIZATION_ID,
    name: "Secretaria Municipal de Cultura",
    slug: "secretaria-municipal-de-cultura",
    budgetUnitCode: "06.001",
    responsibleName: "Ana Souza",
    responsibleRole: "Secretaria Municipal",
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
    processNumber: "PROC-2026-001",
    externalId: "PROC-EXT-001",
    issuedAt: new Date("2026-01-08T00:00:00.000Z"),
    object: "Contratacao de apresentacao artistica",
    justification: "Atender o calendario cultural do municipio.",
    responsibleName: "Ana Souza",
    status: "draft",
    sourceKind: "expense_request",
    sourceReference: "SD-6-2026",
    sourceMetadata: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

test("resolveDocumentGenerationRecipe returns the repository-managed DFD assets", () => {
  const recipe = resolveDocumentGenerationRecipe("dfd");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente o dfd final em markdown/i);
  assert.match(recipe.template, /## 1\. DADOS DA SOLICITACAO/);
  assert.equal(/ESTUDO TECNICO PRELIMINAR/i.test(recipe.template), false);
  assert.equal(/TERMO DE REFERENCIA/i.test(recipe.template), false);
  assert.equal(resolveDocumentGenerationRecipe("tr"), null);
});

test("buildDfdGenerationContext prioritizes source metadata and falls back to department data", () => {
  const contextFromSourceMetadata = buildDfdGenerationContext({
    departments: [
      createDepartmentRow({
        budgetUnitCode: "99.999",
        name: "Departamento Fallback",
        responsibleRole: "Diretoria Fallback",
      }),
    ],
    organization: createOrganizationRow(),
    process: createProcessRow({
      externalId: null,
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Secretaria Municipal de Educacao, Cultura, Esporte e Lazer",
          organizationName: "Municipio de Pureza/RN",
          processType: "Servico",
          requestNumber: "6",
          responsibleName: "Maria Marilda Silva da Rocha",
          responsibleRole: "Secretaria de Educacao, Cultura, Esporte e Lazer",
        },
        warnings: ["Valor estimado nao informado."],
      },
    }),
  });

  assert.equal(contextFromSourceMetadata.budgetUnitCode, "06.001");
  assert.equal(
    contextFromSourceMetadata.budgetUnitName,
    "Secretaria Municipal de Educacao, Cultura, Esporte e Lazer",
  );
  assert.equal(contextFromSourceMetadata.organizationName, "Municipio de Pureza/RN");
  assert.equal(contextFromSourceMetadata.processType, "Servico");
  assert.equal(contextFromSourceMetadata.requestNumber, "6");
  assert.equal(contextFromSourceMetadata.responsibleRole, "Secretaria de Educacao, Cultura, Esporte e Lazer");
  assert.deepEqual(contextFromSourceMetadata.warnings, ["Valor estimado nao informado."]);

  const fallbackContext = buildDfdGenerationContext({
    departments: [
      createDepartmentRow({
        budgetUnitCode: "07.002",
        name: "Secretaria Municipal de Saude",
        responsibleRole: "Secretaria Municipal de Saude",
      }),
    ],
    organization: createOrganizationRow({
      name: "Municipio de Exemplo",
      officialName: "Municipio de Exemplo/CE",
    }),
    process: createProcessRow({
      externalId: "PROC-EXT-777",
      responsibleName: "Joao Lima",
      sourceMetadata: null,
    }),
  });

  assert.equal(fallbackContext.budgetUnitCode, "07.002");
  assert.equal(fallbackContext.budgetUnitName, "Secretaria Municipal de Saude");
  assert.equal(fallbackContext.requestNumber, "PROC-EXT-777");
  assert.equal(fallbackContext.requester, "Secretaria Municipal de Saude");
  assert.equal(fallbackContext.responsibleRole, "Secretaria Municipal de Saude");
  assert.equal(fallbackContext.organizationName, "Municipio de Exemplo/CE");
});

test("buildDocumentGenerationPrompt uses the canonical DFD recipe and process context", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "dfd",
    instructions: "Priorizar linguagem objetiva e sem juridiquese excessivo.",
    organization: createOrganizationRow(),
    process: createProcessRow({
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Secretaria Municipal de Cultura",
          requestNumber: "6",
        },
        warnings: [],
      },
    }),
  });

  assert.match(prompt, /## Modelo Markdown canonico/);
  assert.match(prompt, /# DOCUMENTO DE FORMALIZACAO DE DEMANDA \(DFD\)/);
  assert.match(prompt, /- Tipo de documento: DFD/);
  assert.match(prompt, /- Numero da solicitacao: 6/);
  assert.match(prompt, /Secretaria Municipal de Cultura/);
  assert.match(prompt, /Priorizar linguagem objetiva e sem juridiquese excessivo\./);
  assert.match(prompt, /Nao inclua secoes, titulos ou conteudo de ETP/);
});
