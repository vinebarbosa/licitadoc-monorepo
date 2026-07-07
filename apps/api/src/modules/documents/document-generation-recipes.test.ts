import assert from "node:assert/strict";
import { test } from "vitest";
import type { departments, organizations, processes } from "../../db";
import type { SerializedProcessItem } from "../processes/processes.shared";
import { resolveDocumentGenerationRecipe } from "./document-generation-recipes";
import {
  buildDfdGenerationContext,
  buildDocumentGenerationPrompt,
  buildEtpGenerationContext,
  buildMinutaGenerationContext,
  buildTrGenerationContext,
  formatDocumentProcessType,
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
    crestUrl: null,
    letterheadUrl: null,
    letterheadTemplateUrl: null,
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
    procurementMethod: "inexigibilidade",
    biddingModality: null,
    processNumber: "PROC-2026-001",
    externalId: "PROC-EXT-001",
    issuedAt: new Date("2026-01-08T00:00:00.000Z"),
    title: "Apresentacao artistica",
    object: "Contratacao de apresentacao artistica",
    justification: "Atender o calendario cultural do municipio.",
    responsibleName: "Ana Souza",
    responsibleUserId: "user_responsible",
    status: "draft",
    sourceKind: "expense_request",
    sourceReference: "SD-6-2026",
    sourceMetadata: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function countLiteralOccurrences(value: string, needle: string) {
  return value.split(needle).length - 1;
}

function createCanonicalProcessItems(): SerializedProcessItem[] {
  return [
    {
      id: "item_simple",
      code: "0005909",
      description: "Pote plastico com tampa para armazenamento de merenda escolar",
      kind: "simple",
      quantity: "550",
      title: "Pote plastico para merenda escolar",
      totalValue: "605.00",
      unit: "UN",
      unitValue: "1.10",
    },
    {
      id: "item_kit",
      code: "0005910",
      components: [
        {
          id: "component_1",
          description: "Caderno universitario 10 materias",
          quantity: "1",
          title: "Caderno",
          unit: "UN",
        },
        {
          id: "component_2",
          description: "Estojo com lapis, borracha e apontador",
          quantity: "1",
          title: "Estojo escolar",
          unit: "UN",
        },
      ],
      description: "Kit individual de material pedagogico",
      kind: "kit",
      quantity: "300",
      title: "Kit escolar pedagogico",
      totalValue: "1500.00",
      unit: "KIT",
      unitValue: "5.00",
    },
  ];
}

function assertDfdRoleGuidance(prompt: string) {
  assert.match(prompt, /registro inicial da demanda/i);
  assert.match(prompt, /formal, direta, administrativa e revisável/i);
  assert.match(prompt, /1 ou 2 parágrafos/i);
  assert.match(prompt, /3 a 6 bullets/i);
  assert.match(prompt, /Evite estudo de mercado, metodologia de pesquisa de preços/i);
  assert.match(prompt, /análise de alternativas e matriz de riscos/i);
  assert.match(prompt, /fiscalização detalhada, pagamento, medição, SLA, sanções/i);
  assert.match(prompt, /Mantenha a inteligência administrativa invisível/i);
}

function assertTrOperationalGuidance(prompt: string) {
  assert.match(prompt, /documento técnico-operacional/i);
  assert.match(prompt, /objeto, especificações, execução, recebimento/i);
  assert.match(prompt, /linguagem formal, objetiva, operacional e fiscalizável/i);
  assert.match(
    prompt,
    /ESPECIFICAÇÕES TÉCNICAS DO SERVIÇO funcionar como principal seção operacional/is,
  );
  assert.match(prompt, /Obrigações da contratada e da contratante devem ser práticas/i);
  assert.match(prompt, /responsabilidades práticas da contratada e da contratante/i);
  assert.match(
    prompt,
    /Não transforme o TR em ETP, parecer jurídico, minuta contratual ou checklist genérico/i,
  );
  assert.match(prompt, /placeholder, providência objetiva ou frase curta/i);
  assert.match(prompt, /mais corpo ao que afeta execução, recebimento, fiscalização e pagamento/i);
}

function assertMinutaContractualGuidance(prompt: string) {
  assert.match(prompt, /formaliza contratualmente a operação/i);
  assert.match(prompt, /partes, objeto, preço ou placeholder/i);
  assert.match(prompt, /cláusulas fixas e assinaturas/i);
  assert.match(prompt, /CONTRATANTE.*CONTRATADA/is);
  assert.match(prompt, /execução.*obrigações.*pagamento.*fiscalização.*recebimento/is);
  assert.match(prompt, /linguagem contratual formal, seca e revisável/i);
  assert.match(prompt, /Minuta não é DFD, ETP, TR, parecer jurídico/i);
  assert.match(prompt, /Não inclua seções, títulos ou conteúdo de DFD/i);
  assert.match(prompt, /Prefira cláusulas secas, placeholders preservados/i);
  assert.match(prompt, /Evite repetição de ressalvas e condicionamentos/i);
}

function assertUntitledSignatureClosingBlock(template: string) {
  assert.doesNotMatch(template, /^## .*FECHO/im);
  assert.doesNotMatch(template, /^## .*ASSINATURA/im);
  assert.doesNotMatch(template, /<div|align=|style=|<table/i);
  assert.match(
    template,
    /{{organization\.city}}\/{{organization\.state}}, {{process\.issuedAt_long_br}}\.\n\n{{process\.responsibleName}}\n\n{{department\.responsibleRole_or_sourceResponsibleRole_or_fallback}}/,
  );
}

function assertTiptapSignatureClosingGuidance(instructions: string) {
  assert.match(instructions, /bloco final de local\/data e assinatura não deve ter título/i);
  assert.match(instructions, /Gere assinatura como parágrafos Tiptap simples/i);
  assert.match(instructions, /sem linha de assinatura, sublinhado, tracejado, HTML/i);
  assert.doesNotMatch(instructions, /local\/data alinhável à direita/i);
  assert.doesNotMatch(instructions, /cargo centralizados/i);
}

test("resolveDocumentGenerationRecipe returns the repository-managed DFD assets", () => {
  const recipe = resolveDocumentGenerationRecipe("dfd");

  assert.ok(recipe);
  assert.match(recipe.baseInstructions, /Regras globais de redação documental/i);
  assert.match(recipe.baseInstructions, /invisibilidade da inteligência/i);
  assert.match(recipe.baseInstructions, /Valores `0`, `0,00`, `0.00` e `R\$ 0,00`/i);
  assert.match(recipe.documentInstructions, /registro inicial da demanda/i);
  assert.doesNotMatch(
    recipe.documentInstructions,
    /anti-alucinação|valor zerado|pacote de contexto/i,
  );
  assert.match(recipe.instructions, /documento final no contrato JSON Tiptap restrito/i);
  assert.match(recipe.instructions, /JSON Tiptap é a fonte da verdade/i);
  assert.match(recipe.instructions, /registro inicial da demanda/i);
  assert.match(recipe.instructions, /DFD não é ETP, TR, minuta contratual/i);
  assert.match(recipe.instructions, /3 a 6 bullets/i);
  assert.match(recipe.instructions, /análise de alternativas e matriz de riscos/i);
  assert.doesNotMatch(recipe.instructions, /Guia de adaptação ao objeto/);
  assert.doesNotMatch(recipe.instructions, /eventos ou serviços culturais/i);
  assert.doesNotMatch(recipe.instructions, /serviços técnicos ou administrativos/i);
  assert.doesNotMatch(recipe.instructions, /obras ou engenharia/i);
  assert.match(recipe.instructions, /Não use valor zero como preço/i);
  assertTiptapSignatureClosingGuidance(recipe.instructions);
  assert.match(recipe.instructions, /lista funcionar melhor como conjunto/i);
  assert.match(recipe.instructions, /conjunto da demanda/i);
  assert.match(recipe.instructions, /Enumeração exaustiva item a item/i);
  assert.doesNotMatch(recipe.instructions, /objectSemanticSummary|primaryGroups|summaryLabel/);
  assert.match(recipe.template, /## 1\. DADOS DA SOLICITAÇÃO/);
  assert.match(recipe.template, /{{dfd\.context_and_need}}/);
  assert.match(recipe.template, /{{dfd\.essential_requirement_1}}/);
  assert.doesNotMatch(recipe.template, /objectSemanticSummary|primaryGroups|summaryLabel/);
  assert.doesNotMatch(recipe.template, /grupos concretos identificados na solicitação/i);
  assert.doesNotMatch(recipe.template, /item dominante/i);
  assert.doesNotMatch(recipe.template, /conforme agrupamento dos itens/i);
  assert.equal(/`{{/i.test(recipe.template), false);
  assert.equal(/Carnaval/i.test(recipe.instructions), false);
  assert.equal(/FORR[OÓ] TSUNAMI/i.test(recipe.instructions), false);
  assert.equal(/Carnaval/i.test(recipe.template), false);
  assert.equal(/FORR[OÓ] TSUNAMI/i.test(recipe.template), false);
  assert.equal(/ESTUDO TÉCNICO PRELIMINAR/i.test(recipe.template), false);
  assert.equal(/TERMO DE REFERÊNCIA/i.test(recipe.template), false);
  assertUntitledSignatureClosingBlock(recipe.template);
});

test("resolveDocumentGenerationRecipe returns the repository-managed ETP assets", () => {
  const recipe = resolveDocumentGenerationRecipe("etp");

  assert.ok(recipe);
  assert.match(recipe.baseInstructions, /Regras globais de redação documental/i);
  assert.match(recipe.documentInstructions, /documento analítico da fase preparatória/i);
  assert.doesNotMatch(
    recipe.documentInstructions,
    /anti-alucinação|valor zerado|pacote de contexto/i,
  );
  assert.match(recipe.instructions, /documento final no contrato JSON Tiptap restrito/i);
  assert.match(recipe.instructions, /R\$ 0,00.*ausência de estimativa/i);
  assert.match(recipe.instructions, /Profundidade proporcional ao plano documental/i);
  assert.match(recipe.instructions, /As seções não precisam ter o mesmo tamanho/i);
  assert.doesNotMatch(recipe.instructions, /Guia de adaptação ao objeto/);
  assert.doesNotMatch(recipe.instructions, /execução direta pela Administração/i);
  assert.doesNotMatch(recipe.instructions, /Sistema de Registro de Preços/i);
  assert.doesNotMatch(recipe.instructions, /kits prontos versus montagem interna/i);
  assert.match(recipe.instructions, /gestão\/fiscalização/i);
  assert.match(recipe.instructions, /riscos/i);
  assertTiptapSignatureClosingGuidance(recipe.instructions);
  assert.match(recipe.template, /# ESTUDO TÉCNICO PRELIMINAR \(ETP\)/);
  assert.match(recipe.template, /## 5\. ESTIMATIVA DO VALOR DA CONTRATAÇÃO/);
  assert.match(recipe.template, /## 9\. RISCOS DA CONTRATAÇÃO E MEDIDAS MITIGATÓRIAS/);
  assert.match(recipe.template, /## 10\. BENEFÍCIOS ESPERADOS/);
  assert.match(recipe.template, /## 11\. CONCLUSÃO E RECOMENDAÇÃO/);
  assertUntitledSignatureClosingBlock(recipe.template);
  assert.match(recipe.template, /{{etp\.market_survey}}/);
  assert.match(recipe.template, /{{etp\.risks_and_mitigations}}/);
  assert.equal(/`{{/i.test(recipe.template), false);
  assert.equal(/DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA/i.test(recipe.template), false);
  assert.equal(/TERMO DE REFERÊNCIA/i.test(recipe.template), false);
});

test("resolveDocumentGenerationRecipe returns the repository-managed TR assets", () => {
  const recipe = resolveDocumentGenerationRecipe("tr");

  assert.ok(recipe);
  assert.match(recipe.baseInstructions, /Regras globais de redação documental/i);
  assert.match(recipe.documentInstructions, /documento técnico-operacional da contratação/i);
  assert.doesNotMatch(
    recipe.documentInstructions,
    /anti-alucinação|valor zerado|pacote de contexto/i,
  );
  assert.match(recipe.instructions, /documento final no contrato JSON Tiptap restrito/i);
  assert.match(recipe.instructions, /documento técnico-operacional da contratação/i);
  assert.match(recipe.instructions, /especificações, execução, recebimento/i);
  assert.match(recipe.instructions, /linguagem formal, objetiva, operacional e fiscalizável/i);
  assert.doesNotMatch(recipe.instructions, /Obrigações por tipo de contratação/);
  assert.doesNotMatch(recipe.instructions, /Tipo: apresentacao_artistica/);
  assert.match(recipe.instructions, /R\$ 0,00.*ausência de estimativa/i);
  assert.match(recipe.instructions, /lista de itens/i);
  assert.match(recipe.instructions, /especificações, execução, recebimento/i);
  assert.match(recipe.instructions, /sem reduzir o conjunto ao primeiro item/i);
  assertTiptapSignatureClosingGuidance(recipe.instructions);
  assert.match(recipe.instructions, /responsabilidades práticas da contratada e da contratante/i);
  assert.match(recipe.template, /# TERMO DE REFERÊNCIA/);
  assert.match(recipe.template, /{{tr\.technical_specifications}}/);
  assert.match(recipe.template, /{{tr\.payment_conditions}}/);
  assert.match(recipe.template, /## 4\. OBRIGAÇÕES DA CONTRATADA/);
  assert.match(recipe.template, /## 5\. OBRIGAÇÕES DA CONTRATANTE/);
  assert.match(recipe.template, /## 7\. VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA/);
  assert.match(recipe.template, /## 8\. CONDIÇÕES DE PAGAMENTO/);
  assert.match(recipe.template, /## 10\. SANÇÕES ADMINISTRATIVAS/);
  assertUntitledSignatureClosingBlock(recipe.template);
  assert.equal(/`{{/i.test(recipe.template), false);
  assert.equal(/DADOS DA SOLICITAÇÃO/i.test(recipe.template), false);
  assert.equal(/^## .*LEVANTAMENTO DE MERCADO/im.test(recipe.template), false);
  assert.equal(/^## .*ANÁLISE DE ALTERNATIVAS/im.test(recipe.template), false);
});

test("resolveDocumentGenerationRecipe returns the repository-managed Minuta assets", () => {
  const recipe = resolveDocumentGenerationRecipe("minuta");

  assert.ok(recipe);
  assert.match(recipe.baseInstructions, /Regras globais de redação documental/i);
  assert.match(recipe.documentInstructions, /Minuta formaliza contratualmente a operação/i);
  assert.doesNotMatch(
    recipe.documentInstructions,
    /anti-alucinação|valor zerado|pacote de contexto/i,
  );
  assert.match(recipe.instructions, /documento final no contrato JSON Tiptap restrito/i);
  assert.match(recipe.instructions, /R\$ 0,00.*preço válido/i);
  assert.match(recipe.instructions, /A Minuta formaliza contratualmente a operação/i);
  assert.match(recipe.instructions, /Preservação das cláusulas fixas/i);
  assert.match(recipe.instructions, /placeholders/i);
  assert.doesNotMatch(recipe.instructions, /Tipo: apresentacao_artistica/);
  assert.match(recipe.instructions, /Detalhamento técnico próprio de TR/i);
  assert.match(recipe.template, /# MINUTA DO CONTRATO/);
  assert.match(recipe.template, /CONTRATANTE/);
  assert.match(recipe.template, /CONTRATADA/);
  assert.match(recipe.template, /## CLÁUSULA PRIMEIRA - DO OBJETO/);
  assert.match(recipe.template, /## CLÁUSULA SEGUNDA - DO PREÇO/);
  assert.match(recipe.template, /## CLÁUSULA TERCEIRA - DA EXECUÇÃO/);
  assert.match(recipe.template, /## CLÁUSULA QUARTA - DO PAGAMENTO/);
  assert.match(recipe.template, /## CLÁUSULA QUINTA - DO PRAZO DE VIGÊNCIA/);
  assert.match(recipe.template, /## CLÁUSULA SEXTA - DA DOTAÇÃO ORÇAMENTÁRIA/);
  assert.match(recipe.template, /## CLÁUSULA SÉTIMA - DAS OBRIGAÇÕES DA CONTRATANTE/);
  assert.match(recipe.template, /## CLÁUSULA OITAVA - DAS OBRIGAÇÕES DA CONTRATADA/);
  assert.match(recipe.template, /## CLÁUSULA NONA - DA FISCALIZAÇÃO/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA - DO RECEBIMENTO E ACEITAÇÃO/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA PRIMEIRA - DAS PENALIDADES/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA SEGUNDA - DA RESCISÃO E EXTINÇÃO/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA QUARTA - DA ALTERAÇÃO E REAJUSTE/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA QUINTA - DAS CONDIÇÕES DE HABILITAÇÃO/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA SEXTA - DA PUBLICIDADE/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA SÉTIMA - DOS CASOS OMISSOS/);
  assert.match(recipe.template, /## CLÁUSULA DÉCIMA OITAVA - DO FORO/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLÁUSULA DÉCIMA TERCEIRA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLÁUSULA DÉCIMA QUARTA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLÁUSULA DÉCIMA QUINTA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLÁUSULA DÉCIMA SEXTA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLÁUSULA DÉCIMA SÉTIMA/);
  assert.match(recipe.template, /FIXED_CLAUSE_START: CLÁUSULA DÉCIMA OITAVA/);
  assert.match(recipe.template, /objeto contratual será executado em conformidade/i);
  assert.match(recipe.template, /{{contract\.execution_contextual_clause}}/);
  assert.match(recipe.template, /liquidação da despesa, o ateste/i);
  assert.match(recipe.template, /registrar ocorrências.*atestar a execução/is);
  assert.match(recipe.template, /correção, substituição ou refazimento/i);
  assert.equal(/DADOS DA SOLICITAÇÃO/i.test(recipe.template), false);
  assert.equal(/LEVANTAMENTO DE MERCADO/i.test(recipe.template), false);
  assert.equal(/^## .*ANÁLISE DE ALTERNATIVAS/im.test(recipe.template), false);
  assert.equal(/^## .*TERMO DE REFERÊNCIA/im.test(recipe.template), false);
  assert.equal(/^## .*ESTUDO TÉCNICO PRELIMINAR/im.test(recipe.template), false);
});

test("repository-managed recipe assets use accented formal Portuguese", () => {
  const recipes = ["dfd", "etp", "tr", "minuta"] as const;

  for (const documentType of recipes) {
    const recipe = resolveDocumentGenerationRecipe(documentType);

    assert.ok(recipe);
    assert.match(recipe.instructions, /geração|contratações|contratação|obrigatórias/i);
    assert.match(recipe.instructions, /não/i);
    assert.match(recipe.template, /CONTRATAÇÃO|SOLICITAÇÃO|TÉCNICO|REFERÊNCIA|CLÁUSULA/i);
    assert.doesNotMatch(recipe.instructions, /\bnao\b/i);
    assert.doesNotMatch(recipe.template, /\b(NAO|nao|CONTRATACAO|REFERENCIA|CLAUSULA)\b/);
  }
});

test("repository-managed templates are render-only assets without AI behavior rules", () => {
  const recipes = ["dfd", "etp", "tr", "minuta"] as const;
  const deniedTemplatePhrases = [
    /não invente/i,
    /quando houver/i,
    /na ausência/i,
    /quando suportado/i,
    /não inclua/i,
    /não faça/i,
    /o contexto não apresenta/i,
    /não constam informações/i,
    /deverá ser confirmado/i,
    /pacote de contexto/i,
    /pipeline/i,
  ];

  for (const documentType of recipes) {
    const recipe = resolveDocumentGenerationRecipe(documentType);

    assert.ok(recipe);

    for (const phrase of deniedTemplatePhrases) {
      assert.doesNotMatch(recipe.template, phrase);
    }
  }
});

test("document-specific instructions do not regain sd-document-intelligence responsibilities", () => {
  const recipes = ["dfd", "etp", "tr", "minuta"] as const;
  const deniedDocumentInstructionPhrases = [
    /Semantic Procurement Classifier/i,
    /Nenhuma inferência antes/i,
    /EnrichedContextPackage/i,
    /pacote de contexto enriquecido/i,
    /procurementType/i,
    /operationalNature/i,
    /publicInterestProfile/i,
    /probableLegalPath/i,
    /valor zerado/i,
    /Valores `0`/i,
    /não invente/i,
    /anti-alucinação/i,
  ];

  for (const documentType of recipes) {
    const recipe = resolveDocumentGenerationRecipe(documentType);

    assert.ok(recipe);

    for (const phrase of deniedDocumentInstructionPhrases) {
      assert.doesNotMatch(recipe.documentInstructions, phrase);
    }
  }
});

test("repository-managed recipes preserve required structural slots", () => {
  const dfd = resolveDocumentGenerationRecipe("dfd");
  const etp = resolveDocumentGenerationRecipe("etp");
  const tr = resolveDocumentGenerationRecipe("tr");
  const minuta = resolveDocumentGenerationRecipe("minuta");

  assert.ok(dfd);
  assert.ok(etp);
  assert.ok(tr);
  assert.ok(minuta);

  assert.match(dfd.template, /{{dfd\.context_and_need}}/);
  assert.match(dfd.template, /{{dfd\.essential_requirement_3}}/);
  assert.match(dfd.template, /{{process\.typeLabel}}/);
  assert.doesNotMatch(dfd.template, /{{process\.type}}/);

  assert.match(etp.template, /{{etp\.estimated_value}}/);
  assert.match(etp.template, /{{etp\.conclusion_and_recommendation}}/);

  assert.match(tr.template, /{{tr\.technical_specifications}}/);
  assert.match(tr.template, /{{tr\.administrative_sanctions}}/);

  assert.match(minuta.template, /{{contract\.price_or_placeholder}}/);
  assert.match(minuta.template, /FIXED_CLAUSE_START: CLÁUSULA DÉCIMA TERCEIRA/);
  assert.match(minuta.template, /TESTEMUNHAS:/);
});

test("buildDfdGenerationContext prefers canonical labels and preserves source metadata", () => {
  const contextFromSourceMetadata = buildDfdGenerationContext({
    departments: [
      createDepartmentRow({
        budgetUnitCode: "99.999",
        name: "Secretaria Municipal de Educacao, Cultura, Esporte e Lazer",
        responsibleRole: "Diretoria Fallback",
      }),
    ],
    organization: createOrganizationRow({
      name: "Prefeitura de Pureza",
      officialName: "Municipio de Pureza/RN",
    }),
    process: createProcessRow({
      externalId: null,
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
          item: {
            description: "Apresentacao artistica musical",
            quantity: "1",
            totalValue: "0,00",
            unit: "SERVICO",
          },
          organizationName: "MUNICIPIO DE PUREZA",
          processType: "Servico",
          requestNumber: "6",
          responsibleName: "Maria Marilda Silva da Rocha",
          responsibleRole: "Secretaria de Educacao, Cultura, Esporte e Lazer",
          totalValue: "0,00",
        },
        source: {
          fileName: "SD.pdf",
          label: "SD.pdf",
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
  assert.equal(
    contextFromSourceMetadata.sourceBudgetUnitName,
    "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
  );
  assert.equal(contextFromSourceMetadata.organizationName, "Municipio de Pureza/RN");
  assert.equal(contextFromSourceMetadata.sourceOrganizationName, "MUNICIPIO DE PUREZA");
  assert.equal(contextFromSourceMetadata.processType, "Inexigibilidade");
  assert.equal(contextFromSourceMetadata.requestNumber, "6");
  assert.equal(contextFromSourceMetadata.itemDescription, "Apresentacao artistica musical");
  assert.equal(contextFromSourceMetadata.itemQuantity, "1");
  assert.equal(contextFromSourceMetadata.itemUnit, "SERVICO");
  assert.equal(contextFromSourceMetadata.estimate.available, false);
  assert.equal(contextFromSourceMetadata.estimate.rawValue, "0,00");
  assert.equal(contextFromSourceMetadata.sourceLabel, "SD.pdf");
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

test("formatDocumentProcessType maps stored slugs and humanizes unknown values", () => {
  assert.equal(formatDocumentProcessType("licitacao"), "Licitação");
  assert.equal(formatDocumentProcessType("Servico"), "Serviço");
  assert.equal(formatDocumentProcessType("dispensa_eletronica"), "Dispensa Eletrônica");
  assert.equal(formatDocumentProcessType("regime_especial"), "Regime Especial");
  assert.equal(formatDocumentProcessType("Tomada de preços"), "Tomada de Preços");
  assert.equal(formatDocumentProcessType(null), null);
});

test("buildDfdGenerationContext normalizes reviewed SD items for prompt context", () => {
  const context = buildDfdGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      sourceMetadata: {
        extractedFields: {
          item: {
            description: "Pote plastico legado",
            quantity: "1",
            totalValue: "R$ 999,00",
            unit: "UN",
          },
          items: [
            {},
            {
              code: "0005909",
              description: "Pote plastico para merenda escolar",
              quantity: "550",
              totalValue: "R$ 605,00",
              unit: "UN",
              unitValue: "R$ 1,10",
            },
            {
              code: "0005910",
              description: "Kit com 2 unidades para atividades pedagogicas",
              quantity: 300,
              totalValue: "R$ 1.500,00",
              unit: "KIT",
              unitValue: "R$ 5,00",
            },
          ],
        },
        warnings: [],
      },
    }),
  });

  assert.equal(context.hasSourceItems, true);
  assert.equal(context.sourceItemsCount, 2);
  assert.deepEqual(context.sourceItems, [
    {
      code: "0005909",
      components: [],
      description: "Pote plastico para merenda escolar",
      kind: "source",
      origin: "source",
      quantity: "550",
      title: null,
      totalValue: "R$ 605,00",
      unit: "UN",
      unitValue: "R$ 1,10",
    },
    {
      code: "0005910",
      components: [],
      description: "Kit com 2 unidades para atividades pedagogicas",
      kind: "source",
      origin: "source",
      quantity: "300",
      title: null,
      totalValue: "R$ 1.500,00",
      unit: "KIT",
      unitValue: "R$ 5,00",
    },
  ]);
  assert.match(context.sourceItemsSummary ?? "", /- Itens da SD revisados: 2/);
  assert.match(
    context.sourceItemsSummary ?? "",
    /1\. 0005909 - Pote plastico para merenda escolar \| qtd\. 550 UN \| unitário R\$ 1,10 \| total R\$ 605,00/,
  );
  assert.match(
    context.sourceItemsSummary ?? "",
    /2\. 0005910 - Kit com 2 unidades para atividades pedagogicas \| qtd\. 300 KIT \| unitário R\$ 5,00 \| total R\$ 1\.500,00/,
  );
  assert.equal(context.estimate.available, false);
  assert.equal(context.estimate.rawValue, null);
});

test("buildDfdGenerationContext keeps a single reviewed item on the item-list path", () => {
  const process = createProcessRow({
    sourceMetadata: {
      extractedFields: {
        item: {
          description: "Notebook legado",
          quantity: "1",
          unit: "UN",
        },
        items: [
          {
            code: "0007001",
            description: "Notebook para equipe administrativa",
            quantity: "1",
            unit: "UN",
          },
        ],
      },
      warnings: [],
    },
  });
  const context = buildDfdGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process,
  });
  const prompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "dfd",
    instructions: null,
    organization: createOrganizationRow(),
    process,
  });

  assert.equal(context.hasSourceItems, true);
  assert.equal(context.sourceItemsCount, 1);
  assert.match(context.sourceItemsSummary ?? "", /- Itens da SD revisados: 1/);
  assert.match(context.sourceItemsSummary ?? "", /1\. 0007001 - Notebook/);
  assert.match(prompt, /^- Itens da SD revisados: 1$/m);
  assert.match(prompt, /1\. 0007001 - Notebook para equipe administrativa/);
  assert.doesNotMatch(prompt, /- Descrição do item da origem: Notebook legado/);
});

test("buildDfdGenerationContext prioritizes canonical process items and total estimates", () => {
  const context = buildDfdGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      sourceMetadata: {
        extractedFields: {
          estimatedValue: "R$ 999.999,99",
          items: [
            {
              code: "LEGADO",
              description: "Item legado da SD",
            },
          ],
        },
        warnings: [],
      },
    }),
    processItems: createCanonicalProcessItems(),
  });

  assert.equal(context.hasSourceItems, true);
  assert.equal(context.sourceItemsCount, 2);
  assert.equal(context.estimate.available, true);
  assert.equal(context.estimate.rawValue, "R$ 2.105,00");
  assert.match(context.sourceItemsSummary ?? "", /- Itens do processo: 2/);
  assert.match(context.sourceItemsSummary ?? "", /- Lista de itens do processo:/);
  assert.match(
    context.sourceItemsSummary ?? "",
    /1\. 0005909 - Pote plastico para merenda escolar \| descrição Pote plastico com tampa para armazenamento de merenda escolar \| qtd\. 550 UN \| unitário R\$ 1,10 \| total R\$ 605,00/,
  );
  assert.match(
    context.sourceItemsSummary ?? "",
    /2\. 0005910 - Kit escolar pedagogico \| descrição Kit individual de material pedagogico \| qtd\. 300 KIT \| unitário R\$ 5,00 \| total R\$ 1\.500,00/,
  );
  assert.match(context.sourceItemsSummary ?? "", /Componente 1: Caderno - Caderno universitario/);
  assert.match(context.sourceItemsSummary ?? "", /Componente 2: Estojo escolar - Estojo com lapis/);
  assert.doesNotMatch(context.sourceItemsSummary ?? "", /Itens da SD revisados/);
  assert.doesNotMatch(context.sourceItemsSummary ?? "", /Item legado da SD/);
});

test("buildDfdGenerationContext resolves responsible display data with fallbacks", () => {
  const departments = [
    createDepartmentRow({
      responsibleName: "Responsavel do departamento",
      responsibleRole: "Secretaria Municipal",
    }),
  ];
  const organization = createOrganizationRow();

  const canonicalResponsibleContext = buildDfdGenerationContext({
    departments,
    organization,
    process: createProcessRow({
      responsibleName: "Responsavel legado",
      sourceMetadata: {
        extractedFields: {
          responsibleName: "Responsavel da SD",
        },
        warnings: [],
      },
    }),
    responsibleUserName: "Usuario canônico",
  });
  const storedNameContext = buildDfdGenerationContext({
    departments,
    organization,
    process: createProcessRow({
      responsibleName: "Responsavel legado",
      sourceMetadata: {
        extractedFields: {
          responsibleName: "Responsavel da SD",
        },
        warnings: [],
      },
    }),
  });
  const sourceMetadataContext = buildDfdGenerationContext({
    departments,
    organization,
    process: createProcessRow({
      responsibleName: "",
      sourceMetadata: {
        extractedFields: {
          responsibleName: "Responsavel da SD",
        },
        warnings: [],
      },
    }),
  });
  const departmentContext = buildDfdGenerationContext({
    departments,
    organization,
    process: createProcessRow({
      responsibleName: "",
      sourceMetadata: null,
    }),
  });

  assert.equal(canonicalResponsibleContext.responsibleName, "Usuario canônico");
  assert.equal(storedNameContext.responsibleName, "Responsavel legado");
  assert.equal(sourceMetadataContext.responsibleName, "Responsavel da SD");
  assert.equal(departmentContext.responsibleName, "Responsavel do departamento");
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
  assert.equal("analysisProfile" in context, false);
  assert.equal(context.estimate.available, false);
  assert.equal(context.estimate.displayValue, "não informado");
  assert.equal(context.estimate.rawValue, "R$ 0,00");
  assert.match(context.estimate.guidance, /apuração em etapa própria/i);
});

test("buildEtpGenerationContext preserves reviewed item list without semantic profiling", () => {
  const context = buildEtpGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de itens diversos",
      sourceMetadata: {
        extractedFields: {
          item: {
            description: "material de expediente",
          },
          items: [
            {
              code: "001",
              description: "material de expediente",
            },
            {
              code: "002",
              description: "software de gestao administrativa com suporte de tecnologia",
            },
          ],
        },
        warnings: [],
      },
    }),
  });

  assert.equal("analysisProfile" in context, false);
  assert.equal(context.hasSourceItems, true);
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

test("buildTrGenerationContext preserves estimate context without contracting-type inference", () => {
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

  assert.equal("contractingType" in artisticContext, false);
  assert.equal(artisticContext.estimate.available, false);

  const goodsContext = buildTrGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Aquisicao de materiais de expediente",
    }),
  });

  assert.equal("contractingType" in goodsContext, false);

  const softwareContext = buildTrGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de servico de tecnologia da informacao e suporte de software",
    }),
  });

  assert.equal("contractingType" in softwareContext, false);

  const advisoryContext = buildTrGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de consultoria e assessoria tecnica em recursos humanos",
    }),
  });

  assert.equal("contractingType" in advisoryContext, false);
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

  assert.equal("contractingType" in context, false);
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

  assert.match(prompt, /## Modelo estrutural canônico/);
  assert.match(prompt, /# DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA \(DFD\)/);
  assert.match(prompt, /- Tipo de documento: DFD/);
  assert.match(prompt, /- Tipo do processo administrativo: Inexigibilidade/);
  assert.match(prompt, /- Número da solicitação: 6/);
  assert.match(prompt, /Secretaria Municipal de Cultura/);
  assert.match(prompt, /Priorizar linguagem objetiva e sem juridiquese excessivo\./);
  assert.match(prompt, /Não inclua seções, títulos ou conteúdo de ETP/);
  assert.match(prompt, /Não use crases ou código inline para valores dos campos do DFD/);
  assert.match(prompt, /Mantenha a inteligência administrativa invisível/i);
  assertDfdRoleGuidance(prompt);
});

test("buildDocumentGenerationPrompt does not expose raw process type slugs", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "dfd",
    instructions: null,
    organization: createOrganizationRow(),
    process: createProcessRow({
      biddingModality: null,
      procurementMethod: null,
      type: "licitacao",
    }),
  });

  assert.match(prompt, /- Tipo do processo administrativo: Licitação/);
  assert.doesNotMatch(prompt, /- Tipo do processo administrativo: licitacao/);
  assert.doesNotMatch(prompt, /Processo: {{process\.type}}/);
  assert.doesNotMatch(prompt, /Processo:\s*licitacao/);
});

test("buildDocumentGenerationPrompt includes reviewed SD item lists for every recipe", () => {
  const documentTypes = ["dfd", "etp", "tr", "minuta"] as const;

  for (const documentType of documentTypes) {
    const prompt = buildDocumentGenerationPrompt({
      departments: [createDepartmentRow()],
      documentType,
      instructions: null,
      organization: createOrganizationRow(),
      process: createProcessRow({
        object: "Contratacao de materiais escolares",
        sourceMetadata: {
          extractedFields: {
            item: {
              description: "Pote plastico legado",
              quantity: "1",
              unit: "UN",
            },
            items: [
              {
                code: "0005909",
                description: "Pote plastico para merenda escolar",
                quantity: "550",
                totalValue: "R$ 605,00",
                unit: "UN",
                unitValue: "R$ 1,10",
              },
              {
                code: "0005910",
                description: "Kit com 2 unidades para atividades pedagogicas",
                quantity: "300",
                totalValue: "R$ 1.500,00",
                unit: "KIT",
                unitValue: "R$ 5,00",
              },
            ],
          },
          warnings: [],
        },
      }),
    });

    assert.match(prompt, /- Itens da SD revisados: 2/);
    assert.match(prompt, /- Lista de itens da SD:/);
    assert.match(prompt, /1\. 0005909 - Pote plastico para merenda escolar/);
    assert.match(prompt, /2\. 0005910 - Kit com 2 unidades para atividades pedagogicas/);
    assert.doesNotMatch(prompt, /- Descrição do item (?:da origem|da SD): Pote plastico legado/);
    assert.doesNotMatch(prompt, /- Quantidade do item (?:da origem|da SD): 1/);
  }
});

test("buildDocumentGenerationPrompt uses neutral labels for canonical process items", () => {
  const documentTypes = ["dfd", "etp", "tr", "minuta"] as const;

  for (const documentType of documentTypes) {
    const prompt = buildDocumentGenerationPrompt({
      departments: [createDepartmentRow()],
      documentType,
      instructions: null,
      organization: createOrganizationRow(),
      process: createProcessRow({
        object: "Contratacao de materiais escolares",
      }),
      processItems: createCanonicalProcessItems(),
    });

    assert.match(prompt, /- Itens do processo: 2/);
    assert.match(prompt, /- Lista de itens do processo:/);
    assert.match(prompt, /1\. 0005909 - Pote plastico para merenda escolar/);
    assert.match(prompt, /2\. 0005910 - Kit escolar pedagogico/);
    assert.match(prompt, /Componente 1: Caderno - Caderno universitario 10 materias \| qtd\. 1 UN/);
    assert.match(prompt, /Componente 2: Estojo escolar - Estojo com lapis, borracha e apontador/);
    assert.doesNotMatch(prompt, /- Itens da SD revisados:/);
    assert.doesNotMatch(prompt, /- Lista de itens da SD:/);
  }
});

test("buildDocumentGenerationPrompt derives ETP estimates and Minuta prices from canonical item totals", () => {
  const etpPrompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "etp",
    instructions: null,
    organization: createOrganizationRow(),
    process: createProcessRow(),
    processItems: createCanonicalProcessItems(),
  });
  const minutaPrompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "minuta",
    instructions: null,
    organization: createOrganizationRow(),
    process: createProcessRow(),
    processItems: createCanonicalProcessItems(),
  });

  assert.match(etpPrompt, /- Estimativa disponível: sim/);
  assert.match(etpPrompt, /- Valor bruto de referência: R\$ 2\.105,00/);
  assert.match(etpPrompt, /- Valor a usar na seção de estimativa: R\$ 2\.105,00/);
  assert.match(minutaPrompt, /- Preço disponível: sim/);
  assert.match(minutaPrompt, /- Valor bruto de referência: R\$ 2\.105,00/);
  assert.match(minutaPrompt, /- Valor a usar na cláusula DO PREÇO: R\$ 2\.105,00/);
});

test("buildDocumentGenerationPrompt uses legacy singular item metadata without reviewed items", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [createDepartmentRow()],
    documentType: "tr",
    instructions: null,
    organization: createOrganizationRow(),
    process: createProcessRow({
      sourceMetadata: {
        extractedFields: {
          item: {
            description: "Materiais de expediente",
            quantity: "500",
            unit: "UNIDADE",
          },
          items: [{}],
        },
        warnings: [],
      },
    }),
  });

  assert.doesNotMatch(prompt, /^- Itens da SD revisados:/m);
  assert.match(prompt, /- Descrição do item da SD: Materiais de expediente/);
  assert.match(prompt, /- Quantidade do item da SD: 500/);
  assert.match(prompt, /- Unidade do item da SD: UNIDADE/);
});

test("buildDocumentGenerationPrompt guides cultural DFDs without validating zero values", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [
      createDepartmentRow({
        name: "Secretaria Municipal de Educacao, Cultura, Esporte e Lazer",
        responsibleRole: "Secretaria de Educacao, Cultura, Esporte e Lazer",
      }),
    ],
    documentType: "dfd",
    instructions: null,
    organization: createOrganizationRow({
      name: "Prefeitura de Pureza",
      officialName: "Municipio de Pureza/RN",
    }),
    process: createProcessRow({
      object: "Contratacao de apresentacao artistica musical para as festividades municipais",
      sourceMetadata: {
        extractedFields: {
          budgetUnitCode: "06.001",
          budgetUnitName: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
          item: {
            description: "apresentacao artistica musical",
            quantity: "1",
            totalValue: "0,00",
            unit: "SERVICO",
          },
          organizationName: "MUNICIPIO DE PUREZA",
          requestNumber: "6",
          totalValue: "0,00",
        },
        warnings: [],
      },
    }),
  });

  assert.match(
    prompt,
    /- Unidade orçamentária principal: 06\.001 - Secretaria Municipal de Educacao, Cultura, Esporte e Lazer/,
  );
  assert.match(prompt, /- Nome da unidade extraído da origem: Sec\.Mun\.de Educ,Cultura/);
  assert.match(prompt, /- Organização: Municipio de Pureza\/RN/);
  assert.match(prompt, /- Organização extraída da origem: MUNICIPIO DE PUREZA/);
  assert.match(prompt, /- Descrição do item da origem: apresentacao artistica musical/);
  assert.match(prompt, /- Quantidade do item da origem: 1/);
  assert.match(prompt, /- Valor total\/estimado de referência: 0,00/);
  assert.match(prompt, /- Estimativa disponível: não/);
  assert.match(prompt, /Estimativa pendente de apuração em etapa própria/i);
  assert.match(prompt, /Não use valor zero como preço/i);
  assert.match(prompt, /Use apenas fatos do contexto estruturado e do pacote enriquecido/i);
  assert.match(prompt, /invisibilidade da inteligência/i);
  assertDfdRoleGuidance(prompt);
  assert.equal(/FORR[OÓ] TSUNAMI/i.test(prompt), false);
  assert.equal(/Carnaval/i.test(prompt), false);
});

test("buildDocumentGenerationPrompt guides administrative service DFDs without event-case leakage", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [
      createDepartmentRow({
        name: "Secretaria Municipal de Administracao",
        budgetUnitCode: "03.001",
      }),
    ],
    documentType: "dfd",
    instructions: null,
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de empresa especializada para assessoria e suporte em recursos humanos",
      justification:
        "Necessidade de apoio tecnico para obrigacoes previdenciarias, trabalhistas e rotinas administrativas.",
      sourceMetadata: {
        extractedFields: {
          item: {
            description: "assessoria e suporte em recursos humanos",
            quantity: "12",
            unit: "MES",
          },
          processType: "Servico",
          requestNumber: "30",
        },
        warnings: [],
      },
    }),
  });

  assert.match(prompt, /Use apenas fatos do contexto estruturado e do pacote enriquecido/i);
  assert.match(prompt, /invisibilidade da inteligência/i);
  assert.match(prompt, /assessoria e suporte em recursos humanos/);
  assert.match(prompt, /- Quantidade do item da origem: 12/);
  assert.match(prompt, /- Unidade do item da origem: MES/);
  assertDfdRoleGuidance(prompt);
  assert.equal(/FORR[OÓ] TSUNAMI/i.test(prompt), false);
  assert.equal(/Carnaval de Pureza/i.test(prompt), false);
});

test("buildDocumentGenerationPrompt guides goods acquisition DFDs with quantity and delivery axes", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [
      createDepartmentRow({
        name: "Secretaria Municipal de Educacao",
        budgetUnitCode: "05.001",
      }),
    ],
    documentType: "dfd",
    instructions: null,
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Aquisicao de materiais de expediente para unidades escolares",
      justification: "Reposicao de estoque necessario ao funcionamento das escolas municipais.",
      sourceMetadata: {
        extractedFields: {
          item: {
            description: "materiais de expediente",
            quantity: "500",
            totalValue: "R$ 12.000,00",
            unit: "UNIDADE",
          },
          processType: "Material",
          requestNumber: "42",
        },
        warnings: [],
      },
    }),
  });

  assert.match(prompt, /Use apenas fatos do contexto estruturado e do pacote enriquecido/i);
  assert.match(prompt, /invisibilidade da inteligência/i);
  assert.match(prompt, /- Descrição do item da origem: materiais de expediente/);
  assert.match(prompt, /- Quantidade do item da origem: 500/);
  assert.match(prompt, /- Valor total\/estimado de referência: R\$ 12\.000,00/);
  assert.match(prompt, /- Estimativa disponível: sim/);
  assert.match(prompt, /- Valor a usar como referência no DFD: R\$ 12\.000,00/);
  assertDfdRoleGuidance(prompt);
  assert.equal(/Carnaval/i.test(prompt), false);
});

test("buildDocumentGenerationPrompt keeps representative DFD scenarios proportional", () => {
  const scenarios = [
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Cultura",
        budgetUnitCode: "06.001",
      }),
      itemDescription: "apresentacao artistica musical para evento municipal",
      object: "Contratacao de apresentacao artistica em evento municipal",
      processType: "Servico",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Administracao",
        budgetUnitCode: "03.001",
      }),
      itemDescription: "assessoria tecnica em recursos humanos",
      object: "Contratacao de assessoria tecnica em recursos humanos",
      processType: "Servico",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Educacao",
        budgetUnitCode: "05.001",
      }),
      itemDescription: "material de expediente",
      object: "Aquisicao de material de expediente",
      processType: "Material",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Saude",
        budgetUnitCode: "07.001",
      }),
      itemDescription: "equipamento hospitalar",
      object: "Aquisicao de equipamento para unidade de saude",
      processType: "Material",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Administracao",
        budgetUnitCode: "03.001",
      }),
      itemDescription: "servico de suporte de tecnologia da informacao",
      object: "Contratacao de servico de tecnologia da informacao",
      processType: "Servico",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Infraestrutura",
        budgetUnitCode: "09.001",
      }),
      itemDescription: "reforma de predio publico",
      object: "Contratacao de reforma de predio publico",
      processType: "Obra",
    },
  ];

  for (const scenario of scenarios) {
    const prompt = buildDocumentGenerationPrompt({
      departments: [scenario.department],
      documentType: "dfd",
      instructions: null,
      organization: createOrganizationRow(),
      process: createProcessRow({
        object: scenario.object,
        sourceMetadata: {
          extractedFields: {
            item: {
              description: scenario.itemDescription,
            },
            processType: scenario.processType,
            requestNumber: "10",
          },
          warnings: [],
        },
      }),
    });

    assert.match(prompt, new RegExp(scenario.object.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(
      prompt,
      new RegExp(scenario.itemDescription.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    assert.match(prompt, /Use apenas fatos do contexto estruturado e do pacote enriquecido/i);
    assertDfdRoleGuidance(prompt);
    assert.match(prompt, /Mantenha a inteligência administrativa invisível/i);
    assert.match(prompt, /Não invente número, valor, data, cargo/i);
  }
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

  assert.match(prompt, /## Modelo estrutural canônico/);
  assert.match(prompt, /# ESTUDO TÉCNICO PRELIMINAR \(ETP\)/);
  assert.match(prompt, /- Tipo de documento: ETP/);
  assert.doesNotMatch(prompt, /Perfil de análise inferido para o ETP/);
  assert.match(prompt, /- Número da solicitação: 6/);
  assert.match(prompt, /- Estimativa disponível: não/);
  assert.match(prompt, /- Valor bruto de referência: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na seção de estimativa: não informado/);
  assert.match(prompt, /Use o pacote de contexto enriquecido e o plano documental/i);
  assert.match(prompt, /Preserve a consistência entre objeto, município, organização/);
  assert.match(prompt, /Desenvolva estimativa, riscos, alternativas e fiscalização/i);
  assert.match(prompt, /Evite repetir mecanicamente expressões de ausência de dados/i);
  assert.match(prompt, /Lei nº 14\.133\/2021 e a boas práticas do TCU/);
  assert.match(prompt, /reutilizar ou adaptar contexto de DFD\/SD apenas como conteúdo narrativo/);
});

test("buildDocumentGenerationPrompt uses accented document-facing labels while preserving context values", () => {
  const prompt = buildDocumentGenerationPrompt({
    departments: [
      createDepartmentRow({
        name: "Secretaria Municipal de Educacao",
      }),
    ],
    documentType: "dfd",
    instructions: null,
    organization: createOrganizationRow({
      officialName: "Municipio de Pureza/RN",
    }),
    process: createProcessRow({
      externalId: "6",
      sourceMetadata: {
        extractedFields: {
          item: {
            description: "apresentacao artistica musical",
            quantity: "1",
          },
        },
        warnings: [],
      },
    }),
  });

  assert.match(prompt, /## Modelo estrutural canônico/);
  assert.match(prompt, /## Instruções adicionais do operador/);
  assert.match(prompt, /## Regras finais obrigatórias/);
  assert.match(prompt, /- Número da solicitação: 6/);
  assert.match(prompt, /- Data de emissão \(pt-BR\): 08\/01\/2026/);
  assert.match(prompt, /- Organização: Municipio de Pureza\/RN/);
  assert.match(prompt, /- Descrição do item da origem: apresentacao artistica musical/);
  assert.doesNotMatch(
    prompt,
    /Modelo estrutural canonico|Numero da solicitacao|Data de emissao|Organizacao|Descricao do item/,
  );
});

test("buildDocumentGenerationPrompt uses the canonical TR recipe and pipeline context boundaries", () => {
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

  assert.match(prompt, /## Modelo estrutural canônico/);
  assert.match(prompt, /# TERMO DE REFERÊNCIA/);
  assert.match(prompt, /- Tipo de documento: TR/);
  assert.doesNotMatch(prompt, /Tipo de contratação inferido para obrigações/);
  assert.match(prompt, /- Estimativa disponível: não/);
  assert.match(prompt, /- Valor bruto de referência: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na seção de valor estimado: não informado/);
  assert.doesNotMatch(prompt, /Use prioritariamente o bloco Tipo:/);
  assert.doesNotMatch(prompt, /Tipo: prestacao_servicos_gerais/);
  assert.doesNotMatch(prompt, /Tipo: consultoria_assessoria/);
  assert.doesNotMatch(prompt, /Tipo: tecnologia_software/);
  assert.doesNotMatch(prompt, /Tipo: fornecimento_bens/);
  assert.match(prompt, /Não inclua headings como DADOS DA SOLICITAÇÃO/i);
  assertTrOperationalGuidance(prompt);
  assert.match(prompt, /Maior densidade nas seções de especificações/i);
  assert.match(prompt, /Use apenas fatos do contexto estruturado e do pacote enriquecido/i);
  assert.match(prompt, /Manter consistencia com DFD e ETP\./);
});

test("buildDocumentGenerationPrompt keeps representative TR scenarios operational and safe", () => {
  const scenarios = [
    {
      itemDescription: "apresentacao artistica musical",
      object: "Contratacao de apresentacao artistica musical para evento municipal",
      processType: "Servico",
    },
    {
      itemDescription: "servico de suporte de tecnologia da informacao",
      object: "Contratacao de servico de tecnologia da informacao e suporte de software",
      processType: "Servico",
    },
    {
      itemDescription: "assessoria tecnica em recursos humanos",
      object: "Contratacao de consultoria e assessoria tecnica em recursos humanos",
      processType: "Servico",
    },
    {
      expectedContractingType: "fornecimento_bens",
      expectedGuidance: /substituir ou corrigir itens com defeito/i,
      itemDescription: "material de expediente",
      object: "Aquisicao de material de expediente",
      processType: "Material",
    },
    {
      expectedContractingType: "locacao_equipamentos",
      expectedGuidance: /entrega, instalação, retirada, operação assistida/i,
      itemDescription: "locacao de equipamentos de sonorizacao",
      object: "Locacao de equipamentos de sonorizacao para evento",
      processType: "Locacao",
    },
    {
      expectedContractingType: "eventos_gerais",
      expectedGuidance: /montagem e desmontagem quando esses elementos forem compatíveis/i,
      itemDescription: "organizacao de evento municipal",
      object: "Contratacao de empresa para organizacao de evento municipal",
      processType: "Servico",
    },
    {
      expectedContractingType: "obra_engenharia",
      expectedGuidance: /obra, reforma ou serviço de engenharia conforme escopo/i,
      itemDescription: "reforma de predio publico",
      object: "Contratacao de reforma de predio publico",
      processType: "Obra",
    },
  ];

  for (const scenario of scenarios) {
    const prompt = buildDocumentGenerationPrompt({
      departments: [createDepartmentRow()],
      documentType: "tr",
      instructions: null,
      organization: createOrganizationRow(),
      process: createProcessRow({
        object: scenario.object,
        sourceMetadata: {
          extractedFields: {
            item: {
              description: scenario.itemDescription,
              totalValue: "R$ 0,00",
            },
            processType: scenario.processType,
            requestNumber: "15",
          },
          warnings: [],
        },
      }),
    });

    assert.doesNotMatch(prompt, /Tipo de contratação inferido para obrigações/);
    assert.doesNotMatch(prompt, /Tipo: apresentacao_artistica/);
    assertTrOperationalGuidance(prompt);
    assert.match(prompt, /Levantamento de mercado, análise de alternativas/i);
    assert.match(prompt, /Não inclua headings como DADOS DA SOLICITAÇÃO/i);
    assert.match(prompt, /Não invente número, valor, data, cargo/i);
  }
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

  assert.match(prompt, /## Modelo estrutural canônico/);
  assert.match(prompt, /# MINUTA DO CONTRATO/);
  assert.match(prompt, /- Tipo de documento: MINUTA/);
  assert.doesNotMatch(prompt, /Tipo de contratação inferido para obrigações/);
  assert.match(prompt, /- Número da minuta\/contrato: XXX\/2026/);
  assert.match(prompt, /- Contratada: \[CONTRATADA\]/);
  assert.match(prompt, /- Preço disponível: não/);
  assert.match(prompt, /- Valor bruto de referência: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na cláusula DO PREÇO: R\$ XX\.XXX,XX/);
  assert.match(prompt, /- Dotação orçamentária: XXX/);
  assert.doesNotMatch(prompt, /\{\{budget\.allocation_or_placeholder}}/);
  assert.doesNotMatch(prompt, /\{\{[^}]+}}/);
  assert.doesNotMatch(prompt, /Use prioritariamente o bloco Tipo:/);
  assert.match(prompt, /Cláusulas fixas do template:/);
  assert.match(prompt, /CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS/);
  assert.match(prompt, /Copie as cláusulas fixas exatamente como estão no template/);
  assert.doesNotMatch(prompt, /FIXED_CLAUSE|<!--\s*FIXED_CLAUSE|FIXED\b/);
  assertMinutaContractualGuidance(prompt);
  assert.match(prompt, /Use o pacote de contexto enriquecido e o plano documental/i);
  assert.match(prompt, /Manter consistencia juridica com o TR\./);
});

test("buildDocumentGenerationPrompt keeps representative Minuta scenarios contextual and safe", () => {
  const scenarios = [
    {
      itemDescription: "apresentacao artistica musical",
      object: "Contratacao de apresentacao artistica musical para evento municipal",
      processType: "Servico",
    },
    {
      expectedContractingType: "tecnologia_software",
      expectedGuidance: /LGPD, segurança da informação/i,
      itemDescription: "servico de suporte de tecnologia da informacao",
      object: "Contratacao de servico de tecnologia da informacao e suporte de software",
      processType: "Servico",
    },
    {
      expectedContractingType: "consultoria_assessoria",
      expectedGuidance: /entregáveis, relatórios, reuniões/i,
      itemDescription: "assessoria tecnica em recursos humanos",
      object: "Contratacao de consultoria e assessoria tecnica em recursos humanos",
      processType: "Servico",
    },
    {
      expectedContractingType: "fornecimento_bens",
      expectedGuidance: /entrega, recebimento, inspeção, conformidade/i,
      itemDescription: "material de expediente",
      object: "Aquisicao de material de expediente",
      processType: "Material",
    },
    {
      expectedContractingType: "obra_engenharia",
      expectedGuidance: /cronograma, medição, responsável técnico, diário de obra/i,
      itemDescription: "reforma de predio publico",
      object: "Contratacao de reforma de predio publico",
      processType: "Obra",
    },
    {
      itemDescription: "servico continuado de apoio administrativo",
      object: "Contratacao de servico continuado de apoio administrativo",
      processType: "Servico",
    },
  ];

  for (const scenario of scenarios) {
    const prompt = buildDocumentGenerationPrompt({
      departments: [createDepartmentRow()],
      documentType: "minuta",
      instructions: null,
      organization: createOrganizationRow(),
      process: createProcessRow({
        object: scenario.object,
        sourceMetadata: {
          extractedFields: {
            item: {
              description: scenario.itemDescription,
              totalValue: "R$ 0,00",
            },
            processType: scenario.processType,
            requestNumber: "22",
          },
          warnings: [],
        },
      }),
    });

    assert.doesNotMatch(prompt, /Tipo de contratação inferido para obrigações/);
    assert.doesNotMatch(prompt, /Tipo: apresentacao_artistica/);
    assertMinutaContractualGuidance(prompt);
    assert.match(prompt, /Cláusulas fixas do template:/);
    assert.doesNotMatch(prompt, /FIXED_CLAUSE|<!--\s*FIXED_CLAUSE|FIXED\b/);
    assert.match(prompt, /Não inclua seções, títulos ou conteúdo de DFD/i);
    assert.match(prompt, /Não invente número, valor, data, cargo/i);
    assert.equal(/^## .*TERMO DE REFERÊNCIA/im.test(prompt), false);
    assert.equal(/^## .*ESTUDO TÉCNICO PRELIMINAR/im.test(prompt), false);
  }
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
  assert.match(draft, /## CLÁUSULA DÉCIMA OITAVA - DO FORO/);

  for (const heading of [
    "## CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS",
    "## CLÁUSULA DÉCIMA QUARTA - DA ALTERAÇÃO E REAJUSTE",
    "## CLÁUSULA DÉCIMA QUINTA - DAS CONDIÇÕES DE HABILITAÇÃO",
    "## CLÁUSULA DÉCIMA SEXTA - DA PUBLICIDADE",
    "## CLÁUSULA DÉCIMA SÉTIMA - DOS CASOS OMISSOS",
    "## CLÁUSULA DÉCIMA OITAVA - DO FORO",
  ]) {
    assert.equal(countLiteralOccurrences(draft, heading), 1);
  }
});

test("sanitizeGeneratedDocumentDraft converts unresolved Minuta placeholders to XXX style", () => {
  const draft = sanitizeGeneratedDocumentDraft({
    documentType: "minuta",
    text: [
      "# MINUTA DO CONTRATO N. {{contract.number_or_placeholder}}",
      "",
      "PROCESSO ADMINISTRATIVO N. {{process.processNumber_or_placeholder}}",
      "",
      "## CLÁUSULA PRIMEIRA - DO OBJETO",
      "",
      "1.1. O presente instrumento tem por objeto {{process.object_or_placeholder}}.",
      "",
      "## CLÁUSULA SEGUNDA - DO PREÇO",
      "",
      "2.1. O valor do presente contrato é de {{contract.price_or_placeholder}}.",
      "",
      "## CLÁUSULA SEXTA - DA DOTAÇÃO ORÇAMENTÁRIA",
      "",
      "6.1. As despesas decorrentes deste contrato correrão por conta da seguinte dotação orçamentária: {{budget.allocation_or_placeholder}}.",
      "",
      "{{organization.city}}/{{organization.state}}, {{contract.signatureDate_or_placeholder}}.",
    ].join("\n"),
  });

  assert.doesNotMatch(draft, /\{\{[^}]+}}/);
  assert.match(draft, /# MINUTA DO CONTRATO N\. XXX\/2026/);
  assert.match(draft, /PROCESSO ADMINISTRATIVO N\. XXX\/2026/);
  assert.match(draft, /1\.1\. O presente instrumento tem por objeto XXX\./);
  assert.match(draft, /2\.1\. O valor do presente contrato é de R\$ XX\.XXX,XX\./);
  assert.match(draft, /dotação orçamentária: XXX\./);
  assert.match(draft, /XXX\/XX, XX\/XX\/XXXX\./);
});

test("sanitizeGeneratedDocumentDraft replaces Minuta fixed-clause aliases with canonical clauses", () => {
  const draft = sanitizeGeneratedDocumentDraft({
    documentType: "minuta",
    text: [
      "# MINUTA DO CONTRATO N. XXX/2026",
      "",
      "## CLÁUSULA PRIMEIRA - DO OBJETO",
      "",
      "Objeto contratual.",
      "",
      "## CLÁUSULA DÉCIMA TERCEIRA - DAS ALTERAÇÕES",
      "",
      "13.1. Este instrumento poderá ser alterado mediante termo aditivo.",
      "",
      "## CLÁUSULA DÉCIMA QUARTA - DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO",
      "",
      "14.1. A contratada manterá as condições de habilitação.",
      "",
      "## CLÁUSULA DÉCIMA QUINTA - DA PUBLICAÇÃO",
      "",
      "15.1. A contratante providenciará a publicação.",
    ].join("\n"),
  });

  assert.equal(/DAS ALTERAÇÕES/.test(draft), false);
  assert.equal(/DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO/.test(draft), false);
  assert.equal(/DA PUBLICAÇÃO/.test(draft), false);
  assert.equal(/termo aditivo/i.test(draft), false);
  assert.equal(
    countLiteralOccurrences(draft, "## CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS"),
    1,
  );
  assert.equal(
    countLiteralOccurrences(draft, "## CLÁUSULA DÉCIMA QUARTA - DA ALTERAÇÃO E REAJUSTE"),
    1,
  );
  assert.equal(
    countLiteralOccurrences(draft, "## CLÁUSULA DÉCIMA QUINTA - DAS CONDIÇÕES DE HABILITAÇÃO"),
    1,
  );
  assert.equal(countLiteralOccurrences(draft, "## CLÁUSULA DÉCIMA SEXTA - DA PUBLICIDADE"), 1);
});

test("sanitizeGeneratedDocumentDraft removes duplicated Minuta tail before terminal signatures", () => {
  const draft = sanitizeGeneratedDocumentDraft({
    documentType: "minuta",
    text: [
      "# MINUTA DO CONTRATO N. XXX/2026",
      "",
      "## CLÁUSULA PRIMEIRA - DO OBJETO",
      "",
      "Objeto contratual.",
      "",
      "## CLÁUSULA DÉCIMA PRIMEIRA - DAS SANÇÕES ADMINISTRATIVAS",
      "",
      "11.1. O descumprimento sujeitará a CONTRATADA às sanções previstas na lei.",
      "",
      "## CLÁUSULA DÉCIMA SEGUNDA - DA EXTINÇÃO",
      "",
      "12.1. O contrato poderá ser extinto nas hipóteses legais.",
      "",
      "## CLÁUSULA DÉCIMA TERCEIRA - DAS ALTERAÇÕES",
      "",
      "13.1. O contrato poderá ser alterado mediante termo aditivo.",
      "",
      "## CLÁUSULA DÉCIMA QUARTA - DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO",
      "",
      "14.1. A CONTRATADA manterá as condições de habilitação.",
      "",
      "## CLÁUSULA DÉCIMA QUINTA - DA PUBLICAÇÃO",
      "",
      "15.1. A CONTRATANTE providenciará a publicação do extrato.",
      "",
      "## CLÁUSULA DÉCIMA SEXTA - DOS CASOS OMISSOS",
      "",
      "16.1. Os casos omissos serão resolvidos conforme a Lei n. 14.133/2021.",
      "",
      "## CLÁUSULA DÉCIMA SÉTIMA - DO FORO",
      "",
      "17.1. Fica eleito o foro da comarca de [COMARCA COMPETENTE].",
      "",
      "E, por estarem de acordo, as partes assinam o presente instrumento.",
      "",
      "Pureza/RN, [DATA].",
      "",
      "__________________________________ JOÃO DA FONSECA MOURA NETO Prefeito CONTRATANTE",
      "",
      "__________________________________ [REPRESENTANTE LEGAL DA CONTRATADA] [CARGO] CONTRATADA",
      "",
      "__________________________________ TESTEMUNHA 1 CPF: [CPF]",
      "",
      "__________________________________ TESTEMUNHA 2 CPF: [CPF]",
      "",
      "## CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS",
      "",
      "13.1. Texto canônico anexado indevidamente.",
      "",
      "## CLÁUSULA DÉCIMA QUARTA - DA ALTERAÇÃO E REAJUSTE",
      "",
      "14.1. Texto canônico anexado indevidamente.",
      "",
      "## CLÁUSULA DÉCIMA QUINTA - DAS CONDIÇÕES DE HABILITAÇÃO",
      "",
      "15.1. Texto canônico anexado indevidamente.",
      "",
      "## CLÁUSULA DÉCIMA SEXTA - DA PUBLICIDADE",
      "",
      "16.1. Texto canônico anexado indevidamente.",
      "",
      "## CLÁUSULA DÉCIMA SÉTIMA - DOS CASOS OMISSOS",
      "",
      "17.1. Texto canônico anexado indevidamente.",
      "",
      "## CLÁUSULA DÉCIMA OITAVA - DO FORO",
      "",
      "18.1. Texto canônico anexado indevidamente.",
    ].join("\n"),
  });

  for (const heading of [
    "## CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS",
    "## CLÁUSULA DÉCIMA QUARTA - DA ALTERAÇÃO E REAJUSTE",
    "## CLÁUSULA DÉCIMA QUINTA - DAS CONDIÇÕES DE HABILITAÇÃO",
    "## CLÁUSULA DÉCIMA SEXTA - DA PUBLICIDADE",
    "## CLÁUSULA DÉCIMA SÉTIMA - DOS CASOS OMISSOS",
    "## CLÁUSULA DÉCIMA OITAVA - DO FORO",
  ]) {
    assert.equal(countLiteralOccurrences(draft, heading), 1);
  }

  assert.equal(/DAS ALTERAÇÕES/.test(draft), false);
  assert.equal(/DA PUBLICAÇÃO/.test(draft), false);
  assert.equal(/Texto canônico anexado indevidamente/i.test(draft), false);
  assert.equal(countLiteralOccurrences(draft, "E, por estarem de acordo"), 1);
  assert.ok(
    draft.indexOf("E, por estarem de acordo") >
      draft.indexOf("## CLÁUSULA DÉCIMA OITAVA - DO FORO"),
  );
});

test("sanitizeGeneratedDocumentDraft appends accented fallbacks and keeps accent-insensitive matching", () => {
  const etpDraft = sanitizeGeneratedDocumentDraft({
    documentType: "etp",
    text: "# ESTUDO TECNICO PRELIMINAR (ETP)\n\n## 1. INTRODUCAO\n\nConteúdo.",
  });
  const trDraft = sanitizeGeneratedDocumentDraft({
    documentType: "tr",
    text: "# TERMO DE REFERENCIA\n\n## 1. OBJETO\n\nConteúdo.",
  });
  const minutaDraft = sanitizeGeneratedDocumentDraft({
    documentType: "minuta",
    text: "# MINUTA DO CONTRATO\n\n## CLAUSULA PRIMEIRA - DO OBJETO\n\nObjeto.",
  });

  assert.match(etpDraft, /## 5\. ESTIMATIVA DO VALOR DA CONTRATAÇÃO/);
  assert.match(etpDraft, /O valor estimado dependerá de apuração complementar em etapa própria/);
  assert.match(trDraft, /## 7\. VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA/);
  assert.match(
    trDraft,
    /A estimativa será apurada em etapa própria, com pesquisa de preços compatível com o objeto/,
  );
  assert.match(minutaDraft, /## CLÁUSULA SEGUNDA - DO PREÇO/);
  assert.match(minutaDraft, /2\.1\. O valor do presente contrato é de R\$ XX\.XXX,XX\./);
});

test("sanitizeGeneratedDocumentDraft removes administrative closing headings", () => {
  for (const documentType of ["dfd", "etp", "tr"] as const) {
    const draft = sanitizeGeneratedDocumentDraft({
      documentType,
      text: [
        documentType === "dfd"
          ? "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)"
          : documentType === "etp"
            ? "# ESTUDO TECNICO PRELIMINAR (ETP)"
            : "# TERMO DE REFERENCIA",
        "",
        "## 1. SECAO INICIAL",
        "Conteudo valido.",
        "",
        "## 6. FECHO",
        "",
        "Fortaleza/CE, 08 de janeiro de 2026.",
        "",
        "Ana Souza",
        "",
        "Secretaria Municipal",
      ].join("\n"),
    });

    assert.equal(/^## .*FECHO/im.test(draft), false);
    assert.match(draft, /Fortaleza\/CE, 08 de janeiro de 2026\./);
    assert.doesNotMatch(draft, /_{8,}/);
    assert.match(draft, /Ana Souza/);
    assert.match(draft, /Secretaria Municipal/);
  }
});

test("sanitizeGeneratedDocumentDraft unwraps generated closing alignment HTML", () => {
  for (const documentType of ["dfd", "etp", "tr"] as const) {
    const draft = sanitizeGeneratedDocumentDraft({
      documentType,
      text: [
        documentType === "dfd"
          ? "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)"
          : documentType === "etp"
            ? "# ESTUDO TECNICO PRELIMINAR (ETP)"
            : "# TERMO DE REFERENCIA",
        "",
        "## 1. SECAO INICIAL",
        "Conteudo valido.",
        "",
        '<div align="right">Fortaleza/CE, 08 de janeiro de 2026.</div>',
        '<div align="center">Ana Souza</div>',
        '<div align="center">Secretaria Municipal</div>',
      ].join("\n"),
    });

    assert.doesNotMatch(draft, /<div/i);
    assert.doesNotMatch(draft, /<\/div>/i);
    assert.doesNotMatch(draft, /align=/i);
    assert.doesNotMatch(draft, /_{8,}/);
    assert.match(
      draft,
      /Fortaleza\/CE, 08 de janeiro de 2026\.\n\nAna Souza\n\nSecretaria Municipal/,
    );
  }
});
