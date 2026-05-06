import assert from "node:assert/strict";
import { test } from "vitest";
import type { departments, organizations, processes } from "../../db";
import { resolveDocumentGenerationRecipe } from "./document-generation-recipes";
import {
  buildDfdGenerationContext,
  buildDocumentGenerationPrompt,
  buildEtpGenerationContext,
  buildMinutaGenerationContext,
  buildTrGenerationContext,
  normalizeEtpEstimate,
  normalizeMinutaPrice,
  sanitizeGeneratedDocumentDraft,
} from "./documents.shared";

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
});

test("resolveDocumentGenerationRecipe returns the repository-managed ETP assets", () => {
  const recipe = resolveDocumentGenerationRecipe("etp");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente o etp final em markdown/i);
  assert.match(recipe.instructions, /r\$ 0,00.*ausencia de estimativa/i);
  assert.match(recipe.instructions, /nunca declare que pesquisa de mercado foi realizada/i);
  assert.match(recipe.template, /# ESTUDO TECNICO PRELIMINAR \(ETP\)/);
  assert.match(recipe.template, /## 5\. ESTIMATIVA DO VALOR DA CONTRATACAO/);
  assert.equal(/DOCUMENTO DE FORMALIZACAO DE DEMANDA/i.test(recipe.template), false);
  assert.equal(/TERMO DE REFERENCIA/i.test(recipe.template), false);
});

test("resolveDocumentGenerationRecipe returns the repository-managed TR assets", () => {
  const recipe = resolveDocumentGenerationRecipe("tr");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente o tr final em markdown/i);
  assert.match(recipe.instructions, /Obrigacoes por tipo de contratacao/);
  assert.match(recipe.instructions, /Tipo: apresentacao_artistica/);
  assert.match(recipe.instructions, /Tipo: prestacao_servicos_gerais/);
  assert.match(recipe.instructions, /Tipo: fornecimento_bens/);
  assert.match(recipe.instructions, /Tipo: obra_engenharia/);
  assert.match(recipe.instructions, /Tipo: locacao_equipamentos/);
  assert.match(recipe.instructions, /Tipo: eventos_gerais/);
  assert.match(recipe.instructions, /R\$ 0,00.*ausencia de estimativa/i);
  assert.match(recipe.instructions, /nao informado/);
  assert.match(recipe.instructions, /conforme definicao da Administracao/);
  assert.match(recipe.template, /# TERMO DE REFERENCIA/);
  assert.match(recipe.template, /## 4\. OBRIGACOES DA CONTRATADA/);
  assert.match(recipe.template, /## 5\. OBRIGACOES DA CONTRATANTE/);
  assert.match(recipe.template, /## 7\. VALOR ESTIMADO E DOTACAO ORCAMENTARIA/);
  assert.match(recipe.template, /## 8\. CONDICOES DE PAGAMENTO/);
  assert.match(recipe.template, /## 10\. SANCOES ADMINISTRATIVAS/);
  assert.equal(/DADOS DA SOLICITACAO/i.test(recipe.template), false);
  assert.equal(/LEVANTAMENTO DE MERCADO/i.test(recipe.template), false);
  assert.equal(/ANALISE DE ALTERNATIVAS/i.test(recipe.template), false);
});

test("resolveDocumentGenerationRecipe returns the repository-managed Minuta assets", () => {
  const recipe = resolveDocumentGenerationRecipe("minuta");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente a minuta final em markdown/i);
  assert.match(recipe.instructions, /clausulas marcadas no template como `fixed` sao imutaveis/i);
  assert.match(recipe.instructions, /R\$ 0,00.*ausencia de preco/i);
  assert.match(recipe.instructions, /Tipo: apresentacao_artistica/);
  assert.match(recipe.instructions, /Tipo: prestacao_servicos_gerais/);
  assert.match(recipe.instructions, /Tipo: fornecimento_bens/);
  assert.match(recipe.instructions, /Tipo: obra_engenharia/);
  assert.match(recipe.instructions, /Tipo: locacao_equipamentos/);
  assert.match(recipe.instructions, /Tipo: eventos_gerais/);
  assert.match(recipe.instructions, /nao invente nomes, CPF, CNPJ, enderecos/i);
  assert.match(recipe.template, /# MINUTA DO CONTRATO/);
  assert.match(recipe.template, /CONTRATANTE/);
  assert.match(recipe.template, /CONTRATADA/);
  assert.match(recipe.template, /## CLAUSULA PRIMEIRA - DO OBJETO/);
  assert.match(recipe.template, /## CLAUSULA SEGUNDA - DO PRECO/);
  assert.match(recipe.template, /## CLAUSULA TERCEIRA - DA EXECUCAO/);
  assert.match(recipe.template, /## CLAUSULA QUARTA - DO PAGAMENTO/);
  assert.match(recipe.template, /## CLAUSULA QUINTA - DO PRAZO DE VIGENCIA/);
  assert.match(recipe.template, /## CLAUSULA SEXTA - DA DOTACAO ORCAMENTARIA/);
  assert.match(recipe.template, /## CLAUSULA SETIMA - DAS OBRIGACOES DA CONTRATANTE/);
  assert.match(recipe.template, /## CLAUSULA OITAVA - DAS OBRIGACOES DA CONTRATADA/);
  assert.match(recipe.template, /## CLAUSULA NONA - DA FISCALIZACAO/);
  assert.match(recipe.template, /## CLAUSULA DECIMA - DO RECEBIMENTO E ACEITACAO/);
  assert.match(recipe.template, /## CLAUSULA DECIMA PRIMEIRA - DAS PENALIDADES/);
  assert.match(recipe.template, /## CLAUSULA DECIMA SEGUNDA - DA RESCISAO E EXTINCAO/);
  assert.match(recipe.template, /## CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS/);
  assert.match(recipe.template, /## CLAUSULA DECIMA QUARTA - DA ALTERACAO E REAJUSTE/);
  assert.match(recipe.template, /## CLAUSULA DECIMA QUINTA - DAS CONDICOES DE HABILITACAO/);
  assert.match(recipe.template, /## CLAUSULA DECIMA SEXTA - DA PUBLICIDADE/);
  assert.match(recipe.template, /## CLAUSULA DECIMA SETIMA - DOS CASOS OMISSOS/);
  assert.match(recipe.template, /## CLAUSULA DECIMA OITAVA - DO FORO/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLAUSULA DECIMA TERCEIRA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLAUSULA DECIMA QUARTA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLAUSULA DECIMA QUINTA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLAUSULA DECIMA SEXTA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLAUSULA DECIMA SETIMA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLAUSULA DECIMA OITAVA/);
  assert.equal(/DADOS DA SOLICITACAO/i.test(recipe.template), false);
  assert.equal(/LEVANTAMENTO DE MERCADO/i.test(recipe.template), false);
  assert.equal(/ANALISE DE ALTERNATIVAS/i.test(recipe.template), false);
  assert.equal(/TERMO DE REFERENCIA/i.test(recipe.template), false);
  assert.equal(/ESTUDO TECNICO PRELIMINAR/i.test(recipe.template), false);
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
  assert.equal(
    contextFromSourceMetadata.responsibleRole,
    "Secretaria de Educacao, Cultura, Esporte e Lazer",
  );
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

test("buildEtpGenerationContext normalizes zero estimates as unavailable", () => {
  const context = buildEtpGenerationContext({
    departments: [
      createDepartmentRow({
        budgetUnitCode: "06.001",
        name: "Secretaria Municipal de Educacao, Cultura, Esporte e Lazer",
        responsibleRole: "Secretaria de Educacao, Cultura, Esporte e Lazer",
      }),
    ],
    organization: createOrganizationRow(),
    process: createProcessRow({
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Secretaria Municipal de Educacao, Cultura, Esporte e Lazer",
          item: {
            description: "Apresentacao artistica musical",
            quantity: "1",
            totalValue: "R$ 0,00",
            unit: "SV",
          },
          organizationName: "Municipio de Pureza/RN",
          processType: "Servico",
          requestNumber: "6",
          responsibleName: "Maria Marilda Silva da Rocha",
          responsibleRole: "Secretaria de Educacao, Cultura, Esporte e Lazer",
        },
        warnings: ["item_value_missing"],
      },
    }),
  });

  assert.equal(context.requestNumber, "6");
  assert.equal(context.itemDescription, "Apresentacao artistica musical");
  assert.equal(context.estimate.available, false);
  assert.equal(context.estimate.displayValue, "nao informado");
  assert.equal(context.estimate.rawValue, "R$ 0,00");
  assert.match(context.estimate.guidance, /ausencia de estimativa/i);
});

test("normalizeEtpEstimate treats empty and zero-like values as unavailable", () => {
  for (const value of [null, "", "0", "0,00", "0.00", "R$ 0,00"]) {
    assert.equal(normalizeEtpEstimate(value).available, false);
  }

  const estimate = normalizeEtpEstimate("R$ 12.345,67");

  assert.equal(estimate.available, true);
  assert.equal(estimate.displayValue, "R$ 12.345,67");
});

test("normalizeMinutaPrice treats empty and zero-like values as placeholder prices", () => {
  for (const value of [null, "", "0", "0,00", "0.00", "R$ 0,00"]) {
    const price = normalizeMinutaPrice(value);

    assert.equal(price.available, false);
    assert.equal(price.displayValue, "R$ XX.XXX,XX");
  }

  const price = normalizeMinutaPrice("R$ 12.345,67");

  assert.equal(price.available, true);
  assert.equal(price.displayValue, "R$ 12.345,67");
});

test("buildTrGenerationContext infers contracting type from process context", () => {
  const artisticContext = buildTrGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI",
      sourceMetadata: {
        extractedFields: {
          item: {
            totalValue: "R$ 0,00",
          },
        },
        warnings: [],
      },
    }),
  });

  assert.equal(artisticContext.contractingType, "apresentacao_artistica");
  assert.equal(artisticContext.estimate.available, false);

  const goodsContext = buildTrGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Aquisicao de materiais de expediente",
    }),
  });

  assert.equal(goodsContext.contractingType, "fornecimento_bens");
});

test("buildMinutaGenerationContext normalizes price and extracts contractor placeholders", () => {
  const context = buildMinutaGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI",
      sourceMetadata: {
        extractedFields: {
          contractor: {
            cnpj: "33.333.333/0001-33",
            name: "Empresa Artistica Exemplo",
            representative: "Ivan Lima",
            representativeCpf: "111.222.333-44",
          },
          item: {
            totalValue: "R$ 0,00",
          },
          procedureNumber: "XXX/2026",
        },
        warnings: [],
      },
    }),
  });

  assert.equal(context.contractingType, "apresentacao_artistica");
  assert.equal(context.price.available, false);
  assert.equal(context.price.displayValue, "R$ XX.XXX,XX");
  assert.equal(context.contractorName, "Empresa Artistica Exemplo");
  assert.equal(context.contractorCnpj, "33.333.333/0001-33");
  assert.equal(context.contractorRepresentative, "Ivan Lima");
  assert.equal(context.contractorRepresentativeCpf, "111.222.333-44");
  assert.equal(context.procedureNumber, "XXX/2026");
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

test("buildDocumentGenerationPrompt uses the canonical ETP recipe and safe estimate context", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "etp",
    instructions: "Manter linguagem consistente com o DFD.",
    organization: createOrganizationRow(),
    process: createProcessRow({
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Secretaria Municipal de Cultura",
          item: {
            description: "Apresentacao artistica musical",
            totalValue: "R$ 0,00",
          },
          requestNumber: "6",
        },
        warnings: [],
      },
    }),
  });

  assert.match(prompt, /## Modelo Markdown canonico/);
  assert.match(prompt, /# ESTUDO TECNICO PRELIMINAR \(ETP\)/);
  assert.match(prompt, /- Tipo de documento: ETP/);
  assert.match(prompt, /- Numero da solicitacao: 6/);
  assert.match(prompt, /- Estimativa disponivel: nao/);
  assert.match(prompt, /- Valor bruto extraido da origem: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na secao de estimativa: nao informado/);
  assert.match(prompt, /Nao invente valores e nao simule pesquisa de mercado/);
  assert.match(prompt, /reutilizar ou adaptar contexto de DFD\/SD apenas como conteudo narrativo/);
});

test("buildDocumentGenerationPrompt uses the canonical TR recipe and obligation guidance", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "tr",
    instructions: "Manter consistencia com DFD e ETP.",
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI",
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Secretaria Municipal de Cultura",
          item: {
            description: "Apresentacao artistica musical",
            totalValue: "R$ 0,00",
          },
          requestNumber: "6",
        },
        warnings: [],
      },
    }),
  });

  assert.match(prompt, /## Modelo Markdown canonico/);
  assert.match(prompt, /# TERMO DE REFERENCIA/);
  assert.match(prompt, /- Tipo de documento: TR/);
  assert.match(prompt, /- Tipo de contratacao inferido para obrigacoes: apresentacao_artistica/);
  assert.match(prompt, /- Estimativa disponivel: nao/);
  assert.match(prompt, /- Valor bruto extraido da origem: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na secao de valor estimado: nao informado/);
  assert.match(prompt, /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(prompt, /Tipo: prestacao_servicos_gerais/);
  assert.match(prompt, /Tipo: fornecimento_bens/);
  assert.match(prompt, /Nao inclua headings como DADOS DA SOLICITACAO/i);
  assert.match(prompt, /Nao invente valores, dados tecnicos, datas, locais, duracoes/);
  assert.match(prompt, /Manter consistencia com DFD e ETP\./);
});

test("buildDocumentGenerationPrompt uses the canonical Minuta recipe, placeholders, and FIXED rules", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "minuta",
    instructions: "Manter consistencia juridica com o TR.",
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI",
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Secretaria Municipal de Cultura",
          item: {
            description: "Apresentacao artistica musical",
            totalValue: "R$ 0,00",
          },
          requestNumber: "6",
        },
        warnings: [],
      },
    }),
  });

  assert.match(prompt, /## Modelo Markdown canonico/);
  assert.match(prompt, /# MINUTA DO CONTRATO/);
  assert.match(prompt, /- Tipo de documento: MINUTA/);
  assert.match(prompt, /- Tipo de contratacao inferido para obrigacoes: apresentacao_artistica/);
  assert.match(prompt, /- Numero da minuta\/contrato: XXX\/2026/);
  assert.match(prompt, /- Contratada: \[CONTRATADA\]/);
  assert.match(prompt, /- Preco disponivel: nao/);
  assert.match(prompt, /- Valor bruto extraido da origem: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na clausula DO PRECO: R\$ XX\.XXX,XX/);
  assert.match(prompt, /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(prompt, /Clausulas FIXED do template:/);
  assert.match(prompt, /CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS/);
  assert.match(prompt, /Copie as clausulas FIXED exatamente como estao no template/);
  assert.match(prompt, /Manter consistencia juridica com o TR\./);
});

test("sanitizeGeneratedDocumentDraft preserves Minuta FIXED clauses from the template", () => {
  const draft = sanitizeGeneratedDocumentDraft({
    documentType: "minuta",
    text: [
      "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)",
      "Conteudo que deve ser descartado.",
      "",
      "# MINUTA DO CONTRATO N. XXX/2026",
      "",
      "## CLAUSULA PRIMEIRA - DO OBJETO",
      "Objeto contratual.",
      "",
      "## CLAUSULA SEGUNDA - DO PRECO",
      "Valor R$ 0,00.",
      "",
      "<!-- FIXED_CLAUSE_START: CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS -->",
      "## CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS",
      "",
      "Texto reescrito indevidamente.",
      "<!-- FIXED_CLAUSE_END -->",
      "",
      "## TERMO DE REFERENCIA",
      "Conteudo que deve ser removido.",
    ].join("\n"),
  });

  assert.equal(/DOCUMENTO DE FORMALIZACAO DE DEMANDA/i.test(draft), false);
  assert.equal(/TERMO DE REFERENCIA/i.test(draft), false);
  assert.equal(/FIXED_CLAUSE/i.test(draft), false);
  assert.equal(/Texto reescrito indevidamente/i.test(draft), false);
  assert.equal(/R\$ 0,00/i.test(draft), false);
  assert.match(draft, /R\$ XX\.XXX,XX/);
  assert.match(
    draft,
    /13\.1\. A CONTRATADA reconhece os direitos da CONTRATANTE relativos ao presente contrato/,
  );
  assert.match(draft, /## CLAUSULA DECIMA OITAVA - DO FORO/);
});
