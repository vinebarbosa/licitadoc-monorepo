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
    title: "Apresentacao artistica",
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

function assertDfdRoleGuidance(prompt: string) {
  assert.match(prompt, /documento inicial de formalização da demanda/i);
  assert.match(prompt, /objetivo, administrativo, introdutório, proporcional e revisável/i);
  assert.match(prompt, /1 ou 2 parágrafos/i);
  assert.match(prompt, /3 a 6 bullets curtos/i);
  assert.match(prompt, /Não desenvolva estudo de mercado, metodologia de pesquisa de preços/i);
  assert.match(prompt, /análise de alternativas, estudo de viabilidade, matriz de riscos/i);
  assert.match(prompt, /Não inclua obrigações contratuais detalhadas, fiscalização contratual/i);
  assert.match(prompt, /critérios de pagamento, critérios de medição, aceite, SLA, sanções/i);
  assert.match(prompt, /Não declare economicidade comprovada, vantajosidade/i);
  assert.match(prompt, /valor será apurado na instrução processual/i);
}

function assertTrOperationalGuidance(prompt: string) {
  assert.match(prompt, /documento técnico-operacional/i);
  assert.match(prompt, /executado, acompanhado, fiscalizado, recebido e entregue/i);
  assert.match(prompt, /operacionalizar sem inventar/i);
  assert.match(prompt, /ESPECIFICAÇÕES TÉCNICAS DO SERVIÇO.*principal seção operacional/is);
  assert.match(prompt, /Obrigações da contratada e da contratante devem ser práticas/i);
  assert.match(prompt, /execução, responsabilidades, fluxos, alinhamentos, condicionantes/i);
  assert.match(prompt, /alinhados, confirmados ou consolidados antes da execução/i);
  assert.match(
    prompt,
    /Não transforme o TR em ETP, parecer jurídico, minuta contratual ou checklist genérico/i,
  );
  assert.match(
    prompt,
    /sem afirmar pesquisa realizada, economicidade, vantajosidade ou compatibilidade de mercado/i,
  );
  assert.match(
    prompt,
    /Não invente valores, dados técnicos, rider técnico, datas, locais, durações/i,
  );
  assert.match(prompt, /SLA, sanções específicas, percentuais, fornecedor, credenciais, dotação/i);
}

function assertMinutaContractualGuidance(prompt: string) {
  assert.match(prompt, /formaliza contratualmente a operação/i);
  assert.match(prompt, /transformar a operação em vínculo contratual/i);
  assert.match(prompt, /Cláusulas FIXED.*Cláusulas semi-fixas.*Blocos condicionais/is);
  assert.match(prompt, /CONTRATANTE.*CONTRATADA/is);
  assert.match(prompt, /execução.*obrigações.*pagamento.*fiscalização.*recebimento/is);
  assert.match(prompt, /linguagem contratual/i);
  assert.match(prompt, /Não transforme a Minuta em TR, ETP, parecer jurídico, checklist/i);
  assert.match(prompt, /Não inclua seções, títulos ou conteúdo de DFD/i);
  assert.match(prompt, /Não invente multas, percentuais, SLA, cronogramas/i);
  assert.match(prompt, /rider técnico, garantias, fundamento jurídico específico/i);
  assert.match(prompt, /preserve placeholders ou use redação contratual condicional/i);
}

test("resolveDocumentGenerationRecipe returns the repository-managed DFD assets", () => {
  const recipe = resolveDocumentGenerationRecipe("dfd");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente o dfd final em markdown/i);
  assert.match(recipe.instructions, /documento inicial de formalização da demanda/i);
  assert.match(
    recipe.instructions,
    /Ele não é Estudo Técnico Preliminar \(ETP\), Termo de Referência \(TR\)/i,
  );
  assert.match(recipe.instructions, /densidade moderada/i);
  assert.match(recipe.instructions, /3 a 6 bullets curtos/i);
  assert.match(
    recipe.instructions,
    /Não desenvolva estudo de mercado, metodologia de pesquisa de preços/i,
  );
  assert.match(
    recipe.instructions,
    /análise de alternativas, matriz de riscos, fiscalização contratual/i,
  );
  assert.match(recipe.instructions, /Guia de adaptação ao objeto/);
  assert.match(recipe.instructions, /eventos ou serviços culturais/i);
  assert.match(recipe.instructions, /serviços técnicos ou administrativos/i);
  assert.match(recipe.instructions, /aquisição de bens ou equipamentos/i);
  assert.match(recipe.instructions, /obras ou engenharia/i);
  assert.match(recipe.instructions, /tecnologia/i);
  assert.match(recipe.instructions, /saúde ou educação/i);
  assert.match(recipe.instructions, /Não copie exemplos de uma categoria/i);
  assert.match(recipe.instructions, /não declare compatibilidade com preços de mercado/i);
  assert.match(recipe.instructions, /não envolva dados em crases/i);
  assert.match(recipe.instructions, /Itens da SD revisados/);
  assert.match(recipe.instructions, /demanda como um todo/i);
  assert.match(recipe.instructions, /não transforme o DFD em enumeração exaustiva item a item/i);
  assert.doesNotMatch(recipe.instructions, /objectSemanticSummary|primaryGroups|summaryLabel/);
  assert.match(recipe.template, /## 1\. DADOS DA SOLICITAÇÃO/);
  assert.match(recipe.template, /normalmente em 1 ou 2 parágrafos/i);
  assert.match(recipe.template, /Não desenvolva análise estratégica ampla, estudo de viabilidade/i);
  assert.match(
    recipe.template,
    /Não aprofunde requisitos técnicos, planejamento de execução, fiscalização/i,
  );
  assert.match(recipe.template, /Não declare economicidade comprovada, vantajosidade/i);
  assert.match(recipe.template, /Liste de 3 a 6 requisitos essenciais/i);
  assert.match(recipe.template, /Não inclua cláusulas contratuais detalhadas/i);
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
});

test("resolveDocumentGenerationRecipe returns the repository-managed ETP assets", () => {
  const recipe = resolveDocumentGenerationRecipe("etp");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente o etp final em markdown/i);
  assert.match(recipe.instructions, /r\$ 0,00.*ausência de estimativa/i);
  assert.match(recipe.instructions, /nunca declare que pesquisa de mercado foi realizada/i);
  assert.match(recipe.instructions, /nunca com aparência de resposta de IA/i);
  assert.match(recipe.instructions, /checklist preenchido/i);
  assert.match(recipe.instructions, /Lei nº 14\.133\/2021/i);
  assert.match(recipe.instructions, /não invente artigo, inciso, acórdão/i);
  assert.match(recipe.instructions, /Guia de adaptação ao objeto/);
  assert.match(recipe.instructions, /apresentações artísticas ou eventos culturais/i);
  assert.match(recipe.instructions, /metodologia futura de pesquisa de preços/i);
  assert.match(recipe.instructions, /a definição ocorrerá em etapa posterior/i);
  assert.match(recipe.instructions, /será objeto de apuração complementar/i);
  assert.match(recipe.instructions, /gestão e fiscalização/i);
  assert.match(recipe.instructions, /riscos/i);
  assert.match(recipe.instructions, /Benefícios esperados/i);
  assert.match(recipe.instructions, /Preserve rigorosamente o objeto, município, organização/i);
  assert.match(recipe.instructions, /Itens da SD revisados/);
  assert.match(recipe.instructions, /necessidade, da solução, da viabilidade, das alternativas/i);
  assert.match(recipe.instructions, /Não invente itens, grupos ou categorias/i);
  assert.match(recipe.template, /# ESTUDO TÉCNICO PRELIMINAR \(ETP\)/);
  assert.match(recipe.template, /## 5\. ESTIMATIVA DO VALOR DA CONTRATAÇÃO/);
  assert.match(recipe.template, /## 9\. RISCOS DA CONTRATAÇÃO E MEDIDAS MITIGATÓRIAS/);
  assert.match(recipe.template, /## 10\. BENEFÍCIOS ESPERADOS/);
  assert.match(recipe.template, /## 11\. CONCLUSÃO E RECOMENDAÇÃO/);
  assert.match(recipe.template, /## 12\. FECHO/);
  assert.match(recipe.template, /metodologia de apuração/i);
  assert.match(recipe.template, /não deve parecer uma justificativa automática/i);
  assert.match(recipe.template, /medidas mitigatórias/i);
  assert.match(recipe.template, /valor administrativo da contratação/i);
  assert.match(recipe.template, /parágrafos institucionais, contínuos e bem conectados/i);
  assert.equal(/`{{/i.test(recipe.template), false);
  assert.equal(/DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA/i.test(recipe.template), false);
  assert.equal(/TERMO DE REFERÊNCIA/i.test(recipe.template), false);
});

test("resolveDocumentGenerationRecipe returns the repository-managed TR assets", () => {
  const recipe = resolveDocumentGenerationRecipe("tr");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente o tr final em markdown/i);
  assert.match(recipe.instructions, /documento técnico-operacional da contratação/i);
  assert.match(recipe.instructions, /execução contratual/i);
  assert.match(recipe.instructions, /executado, acompanhado, fiscalizado, recebido e entregue/i);
  assert.match(recipe.instructions, /operacionalizar sem inventar/i);
  assert.match(recipe.instructions, /não predominantemente analítico/i);
  assert.match(recipe.instructions, /Obrigações por tipo de contratação/);
  assert.match(recipe.instructions, /Tipo: apresentacao_artistica/);
  assert.match(recipe.instructions, /Tipo: prestacao_servicos_gerais/);
  assert.match(recipe.instructions, /Tipo: consultoria_assessoria/);
  assert.match(recipe.instructions, /Tipo: tecnologia_software/);
  assert.match(recipe.instructions, /Tipo: fornecimento_bens/);
  assert.match(recipe.instructions, /Tipo: obra_engenharia/);
  assert.match(recipe.instructions, /Tipo: locacao_equipamentos/);
  assert.match(recipe.instructions, /Tipo: eventos_gerais/);
  assert.match(recipe.instructions, /R\$ 0,00.*ausência de estimativa/i);
  assert.match(recipe.instructions, /sem afirmar que pesquisa de mercado já foi realizada/i);
  assert.match(recipe.instructions, /rider técnico, datas exatas, locais, durações/i);
  assert.match(recipe.instructions, /percentuais, SLA, sanções específicas/i);
  assert.match(recipe.instructions, /Itens da SD revisados/);
  assert.match(recipe.instructions, /objeto, especificações, entrega, recebimento/i);
  assert.match(recipe.instructions, /Não trate o primeiro item como representante único/i);
  assert.match(
    recipe.instructions,
    /A gestão e fiscalização devem refletir o acompanhamento real/i,
  );
  assert.match(recipe.template, /# TERMO DE REFERÊNCIA/);
  assert.match(recipe.template, /principal seção operacional do TR/i);
  assert.match(recipe.template, /dinâmica de execução, entrega, disponibilização ou prestação/i);
  assert.match(
    recipe.template,
    /responsabilidades práticas de preparação, execução, comunicação e correção/i,
  );
  assert.match(recipe.template, /não se limite a registrar ausência/i);
  assert.match(
    recipe.template,
    /pagamento deverá estar condicionado à execução regular do objeto/i,
  );
  assert.match(recipe.template, /comunicação de falhas, atrasos, impedimentos ou irregularidades/i);
  assert.match(recipe.template, /Não invente percentuais, valores de multa, prazos/i);
  assert.match(recipe.template, /## 4\. OBRIGAÇÕES DA CONTRATADA/);
  assert.match(recipe.template, /## 5\. OBRIGAÇÕES DA CONTRATANTE/);
  assert.match(recipe.template, /## 7\. VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA/);
  assert.match(recipe.template, /## 8\. CONDIÇÕES DE PAGAMENTO/);
  assert.match(recipe.template, /## 10\. SANÇÕES ADMINISTRATIVAS/);
  assert.equal(/`{{/i.test(recipe.template), false);
  assert.equal(/DADOS DA SOLICITAÇÃO/i.test(recipe.template), false);
  assert.equal(/^## .*LEVANTAMENTO DE MERCADO/im.test(recipe.template), false);
  assert.equal(/^## .*ANÁLISE DE ALTERNATIVAS/im.test(recipe.template), false);
});

test("resolveDocumentGenerationRecipe returns the repository-managed Minuta assets", () => {
  const recipe = resolveDocumentGenerationRecipe("minuta");

  assert.ok(recipe);
  assert.match(recipe.instructions, /retorne somente a minuta final em markdown/i);
  assert.match(recipe.instructions, /cláusulas marcadas no template como `fixed` são imutáveis/i);
  assert.match(recipe.instructions, /R\$ 0,00.*ausência de preço/i);
  assert.match(recipe.instructions, /A Minuta formaliza contratualmente a operação/i);
  assert.match(recipe.instructions, /Cláusulas semi-fixas/);
  assert.match(recipe.instructions, /Blocos condicionais/);
  assert.match(recipe.instructions, /Trechos contextuais/);
  assert.match(recipe.instructions, /Tipo: apresentacao_artistica/);
  assert.match(recipe.instructions, /Tipo: prestacao_servicos_gerais/);
  assert.match(recipe.instructions, /Tipo: tecnologia_software/);
  assert.match(recipe.instructions, /Tipo: consultoria_assessoria/);
  assert.match(recipe.instructions, /Tipo: fornecimento_bens/);
  assert.match(recipe.instructions, /Tipo: obra_engenharia/);
  assert.match(recipe.instructions, /Tipo: locacao_equipamentos/);
  assert.match(recipe.instructions, /Tipo: eventos_gerais/);
  assert.match(recipe.instructions, /não invente nomes, CPF, CNPJ, endereços/i);
  assert.match(recipe.instructions, /Não invente multas, percentuais, SLA, cronogramas/i);
  assert.match(recipe.instructions, /programação oficial do evento/i);
  assert.match(recipe.instructions, /LGPD, segurança da informação/i);
  assert.match(recipe.instructions, /entregáveis, relatórios, reuniões/i);
  assert.match(recipe.instructions, /entrega, recebimento, inspeção, conformidade/i);
  assert.match(recipe.instructions, /diário de obra/i);
  assert.match(recipe.instructions, /serviço continuado/i);
  assert.match(recipe.instructions, /Itens da SD revisados/);
  assert.match(recipe.instructions, /cláusulas de objeto, execução, recebimento e obrigações/i);
  assert.match(recipe.instructions, /Não copie detalhamento técnico próprio de TR/i);
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
  assert.match(recipe.template, /dinâmica operacional compatível com o objeto contratado/i);
  assert.match(recipe.template, /liquidação da despesa, o ateste/i);
  assert.match(recipe.template, /registrar ocorrências.*atestar a execução/is);
  assert.match(recipe.template, /correção, substituição ou refazimento/i);
  assert.match(recipe.template, /Não invente multa, percentual, valor, prazo/i);
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
  assert.equal(contextFromSourceMetadata.processType, "Servico");
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
  assert.equal(context.analysisProfile, "apresentacao_artistica");
  assert.equal(context.estimate.available, false);
  assert.equal(context.estimate.displayValue, "não informado");
  assert.equal(context.estimate.rawValue, "R$ 0,00");
  assert.match(context.estimate.guidance, /ausência de estimativa/i);
});

test("buildEtpGenerationContext infers analysis profile from the full reviewed item list", () => {
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

  assert.equal(context.analysisProfile, "tecnologia_software");
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

  const softwareContext = buildTrGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de servico de tecnologia da informacao e suporte de software",
    }),
  });

  assert.equal(softwareContext.contractingType, "tecnologia_software");

  const advisoryContext = buildTrGenerationContext({
    departments: [createDepartmentRow()],
    organization: createOrganizationRow(),
    process: createProcessRow({
      object: "Contratacao de consultoria e assessoria tecnica em recursos humanos",
    }),
  });

  assert.equal(advisoryContext.contractingType, "consultoria_assessoria");
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

  assert.match(prompt, /## Modelo Markdown canônico/);
  assert.match(prompt, /# DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA \(DFD\)/);
  assert.match(prompt, /- Tipo de documento: DFD/);
  assert.match(prompt, /- Número da solicitação: 6/);
  assert.match(prompt, /Secretaria Municipal de Cultura/);
  assert.match(prompt, /Priorizar linguagem objetiva e sem juridiquese excessivo\./);
  assert.match(prompt, /Não inclua seções, títulos ou conteúdo de ETP/);
  assert.match(prompt, /Não use crases ou código inline para valores dos campos do DFD/);
  assert.match(prompt, /Não declare compatibilidade com mercado, fundamento legal, duração/);
  assertDfdRoleGuidance(prompt);
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
  assert.match(prompt, /- Valor total\/estimado extraído da origem: 0,00/);
  assert.match(prompt, /- Estimativa disponível: não/);
  assert.match(prompt, /Valor ausente ou informado como zero/i);
  assert.match(prompt, /não declare compatibilidade com preços de mercado/i);
  assert.match(prompt, /eventos ou serviços culturais/i);
  assert.match(prompt, /objeto, acesso público, contexto do evento/i);
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

  assert.match(prompt, /serviços técnicos ou administrativos/i);
  assert.match(prompt, /necessidade administrativa, apoio às rotinas, continuidade/i);
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

  assert.match(prompt, /aquisição de bens ou equipamentos/i);
  assert.match(prompt, /especificação mínima, quantidade e unidade quando fornecidas, entrega/i);
  assert.match(prompt, /- Descrição do item da origem: materiais de expediente/);
  assert.match(prompt, /- Quantidade do item da origem: 500/);
  assert.match(prompt, /- Valor total\/estimado extraído da origem: R\$ 12\.000,00/);
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
      expected: /eventos ou serviços culturais/i,
      itemDescription: "apresentacao artistica musical para evento municipal",
      object: "Contratacao de apresentacao artistica em evento municipal",
      processType: "Servico",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Administracao",
        budgetUnitCode: "03.001",
      }),
      expected: /serviços técnicos ou administrativos/i,
      itemDescription: "assessoria tecnica em recursos humanos",
      object: "Contratacao de assessoria tecnica em recursos humanos",
      processType: "Servico",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Educacao",
        budgetUnitCode: "05.001",
      }),
      expected: /aquisição de bens ou equipamentos/i,
      itemDescription: "material de expediente",
      object: "Aquisicao de material de expediente",
      processType: "Material",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Saude",
        budgetUnitCode: "07.001",
      }),
      expected: /aquisição de bens ou equipamentos/i,
      itemDescription: "equipamento hospitalar",
      object: "Aquisicao de equipamento para unidade de saude",
      processType: "Material",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Administracao",
        budgetUnitCode: "03.001",
      }),
      expected: /tecnologia/i,
      itemDescription: "servico de suporte de tecnologia da informacao",
      object: "Contratacao de servico de tecnologia da informacao",
      processType: "Servico",
    },
    {
      department: createDepartmentRow({
        name: "Secretaria Municipal de Infraestrutura",
        budgetUnitCode: "09.001",
      }),
      expected: /obras ou engenharia/i,
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

    assert.match(prompt, scenario.expected);
    assertDfdRoleGuidance(prompt);
    assert.match(prompt, /Não declare compatibilidade com mercado, fundamento legal, duração/);
    assert.match(prompt, /exclusividade, reconhecimento artístico, dotação orçamentária/);
    assert.match(prompt, /sem inventar fatos/);
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

  assert.match(prompt, /## Modelo Markdown canônico/);
  assert.match(prompt, /# ESTUDO TÉCNICO PRELIMINAR \(ETP\)/);
  assert.match(prompt, /- Tipo de documento: ETP/);
  assert.match(prompt, /- Perfil de análise inferido para o ETP: apresentacao_artistica/);
  assert.match(prompt, /- Número da solicitação: 6/);
  assert.match(prompt, /- Estimativa disponível: não/);
  assert.match(prompt, /- Valor bruto extraído da origem: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na seção de estimativa: não informado/);
  assert.match(prompt, /Use o perfil de análise inferido apenas para ajustar a ênfase técnica/);
  assert.match(prompt, /Preserve a consistência entre objeto, município, organização/);
  assert.match(prompt, /Não cite artista, fornecedor, órgão, município, objeto/);
  assert.match(prompt, /Não misture informações de DFD, TR, minuta/);
  assert.match(prompt, /desenvolva metodologia de apuração posterior com linguagem institucional/);
  assert.match(prompt, /Não invente valores, não simule pesquisa de mercado/);
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

  assert.match(prompt, /## Modelo Markdown canônico/);
  assert.match(prompt, /## Instruções adicionais do operador/);
  assert.match(prompt, /## Regras finais obrigatórias/);
  assert.match(prompt, /- Número da solicitação: 6/);
  assert.match(prompt, /- Data de emissão \(pt-BR\): 08\/01\/2026/);
  assert.match(prompt, /- Organização: Municipio de Pureza\/RN/);
  assert.match(prompt, /- Descrição do item da origem: apresentacao artistica musical/);
  assert.doesNotMatch(
    prompt,
    /Modelo Markdown canonico|Numero da solicitacao|Data de emissao|Organizacao|Descricao do item/,
  );
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

  assert.match(prompt, /## Modelo Markdown canônico/);
  assert.match(prompt, /# TERMO DE REFERÊNCIA/);
  assert.match(prompt, /- Tipo de documento: TR/);
  assert.match(prompt, /- Tipo de contratação inferido para obrigações: apresentacao_artistica/);
  assert.match(prompt, /- Estimativa disponível: não/);
  assert.match(prompt, /- Valor bruto extraído da origem: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na seção de valor estimado: não informado/);
  assert.match(prompt, /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(prompt, /Tipo: prestacao_servicos_gerais/);
  assert.match(prompt, /Tipo: consultoria_assessoria/);
  assert.match(prompt, /Tipo: tecnologia_software/);
  assert.match(prompt, /Tipo: fornecimento_bens/);
  assert.match(prompt, /Não inclua headings como DADOS DA SOLICITAÇÃO/i);
  assertTrOperationalGuidance(prompt);
  assert.match(prompt, /logística, operação, comunicação, conformidade, apoio técnico/i);
  assert.match(prompt, /passagem de som ou ajustes técnicos quando houver suporte no contexto/i);
  assert.match(prompt, /Manter consistencia com DFD e ETP\./);
});

test("buildDocumentGenerationPrompt keeps representative TR scenarios operational and safe", () => {
  const scenarios = [
    {
      expectedContractingType: "apresentacao_artistica",
      expectedGuidance: /passagem de som ou ajustes técnicos quando houver suporte no contexto/i,
      itemDescription: "apresentacao artistica musical",
      object: "Contratacao de apresentacao artistica musical para evento municipal",
      processType: "Servico",
    },
    {
      expectedContractingType: "tecnologia_software",
      expectedGuidance: /implantação, configuração, suporte, manutenção, integração/i,
      itemDescription: "servico de suporte de tecnologia da informacao",
      object: "Contratacao de servico de tecnologia da informacao e suporte de software",
      processType: "Servico",
    },
    {
      expectedContractingType: "consultoria_assessoria",
      expectedGuidance: /relatórios ou produtos quando esses elementos forem previstos/i,
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

    assert.match(
      prompt,
      new RegExp(
        `- Tipo de contratação inferido para obrigações: ${scenario.expectedContractingType}`,
      ),
    );
    assert.match(prompt, scenario.expectedGuidance);
    assertTrOperationalGuidance(prompt);
    assert.match(prompt, /levantamento de mercado, análise de alternativas, matriz de riscos/i);
    assert.match(prompt, /Não inclua headings como DADOS DA SOLICITAÇÃO/i);
    assert.match(prompt, /Não invente valores, dados técnicos, rider técnico/i);
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

  assert.match(prompt, /## Modelo Markdown canônico/);
  assert.match(prompt, /# MINUTA DO CONTRATO/);
  assert.match(prompt, /- Tipo de documento: MINUTA/);
  assert.match(prompt, /- Tipo de contratação inferido para obrigações: apresentacao_artistica/);
  assert.match(prompt, /- Número da minuta\/contrato: XXX\/2026/);
  assert.match(prompt, /- Contratada: \[CONTRATADA\]/);
  assert.match(prompt, /- Preço disponível: não/);
  assert.match(prompt, /- Valor bruto extraído da origem: R\$ 0,00/);
  assert.match(prompt, /- Valor a usar na cláusula DO PREÇO: R\$ XX\.XXX,XX/);
  assert.match(prompt, /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(prompt, /Cláusulas FIXED do template:/);
  assert.match(prompt, /CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS/);
  assert.match(prompt, /Copie as cláusulas FIXED exatamente como estão no template/);
  assertMinutaContractualGuidance(prompt);
  assert.match(prompt, /programação oficial do evento/i);
  assert.match(prompt, /alinhamentos operacionais previamente definidos entre as partes/i);
  assert.match(prompt, /Manter consistencia juridica com o TR\./);
});

test("buildDocumentGenerationPrompt keeps representative Minuta scenarios contextual and safe", () => {
  const scenarios = [
    {
      expectedContractingType: "apresentacao_artistica",
      expectedGuidance: /programação oficial do evento/i,
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
      expectedContractingType: "prestacao_servicos_gerais",
      expectedGuidance: /execução continuada ou não continuada conforme escopo/i,
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

    assert.match(
      prompt,
      new RegExp(
        `- Tipo de contratação inferido para obrigações: ${scenario.expectedContractingType}`,
      ),
    );
    assert.match(prompt, scenario.expectedGuidance);
    assertMinutaContractualGuidance(prompt);
    assert.match(prompt, /Cláusulas FIXED do template:/);
    assert.match(prompt, /Não inclua seções, títulos ou conteúdo de DFD/i);
    assert.match(prompt, /Não invente multas, percentuais, SLA, cronogramas/i);
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
    /Valor não informado no contexto; a estimativa será apurada posteriormente por pesquisa de mercado ou etapa própria\./,
  );
  assert.match(minutaDraft, /## CLÁUSULA SEGUNDA - DO PREÇO/);
  assert.match(minutaDraft, /O preço não consta no contexto ou foi informado como zero/);
});
