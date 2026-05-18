---
name: sd-document-intelligence
description: Inteligência documental para Solicitações de Despesa do Licitadoc. Use quando Codex precisar interpretar semanticamente uma SD como fonte estruturada, classificar a contratação, comprimir o objeto, separar fatos de inferências, registrar pendências, riscos e alternativas, recomendar tom e planejar DFD, ETP, TR ou minuta sem assumir tipo fixo de contratação.
---

# Inteligência Documental de SD

Use esta skill como a inteligência documental de SD do pipeline do Licitadoc. Ela recebe fatos extraídos da Solicitação de Despesa e produz um pacote de contexto enriquecido, document-neutral e validável.

Fluxo esperado:

```text
SD
  ↓
Extractor Agent
  ↓
SD Document Intelligence / Context Enrichment Agent
  ↓
Document Planning Agent
  ↓
Document Writer Agent
  ↓
Document Reviewer Agent
  ↓
Final Rewrite Agent
  ↓
Documento final
```

## Responsabilidade da Inteligência Documental

Interpretar semanticamente a SD depois da extração factual:

1. Classificar a natureza da contratação.
2. Comprimir semanticamente o objeto.
3. Derivar inferências administrativas contextualizadas.
4. Registrar pendências sem preencher lacunas por suposição.
5. Detectar riscos compatíveis.
6. Propor alternativas plausíveis.
7. Recomendar tom e profundidade documental.
8. Preparar planejamento documental por tipo.
9. Gerar hints de escrita para DFD, ETP, TR e Minuta.

Esta skill não escreve o documento final. Ela fornece contexto e planejamento para os agentes seguintes.

## Princípio Central

Nenhuma inferência antes da classificação semântica.

Trabalhe sempre em três camadas separadas:

- **Fatos extraídos**: dados expressos na SD ou no processo.
- **Inferências contextualizadas**: conclusões prudentes derivadas da classificação e do objeto.
- **Pendências**: lacunas que não podem ser preenchidas por suposição.

Nunca apresente inferência como fato confirmado. Nunca invente preço, pesquisa de mercado, dotação, fonte, prazo, local, fornecedor, marca, público atendido, quantidade, fundamento legal específico, modalidade de contratação ou condição operacional não informada.

## Entrada Esperada

Use preferencialmente a saída do Extractor Agent:

- dados administrativos da SD/processo;
- objeto literal;
- justificativa literal;
- lista completa de itens, quantidades, unidades e valores;
- data, unidade, responsável, cargo e processo;
- classificação administrativa informada, se existir;
- dados orçamentários, se existirem.

O Extractor Agent não deve inferir. Se estiver trabalhando diretamente a partir da SD, separe primeiro os fatos literais antes de aplicar esta skill.

Trate valores `0`, `0,00`, `0.00` ou `R$ 0,00` como ausência de estimativa válida, não como preço.

## Fluxo de Enriquecimento

### 1. Classificar Semanticamente

Use o Semantic Procurement Classifier antes de qualquer inferência:

- `procurementType`: goods, service, engineering, event, social_action, continuous_service, technical_service, institutional_action, consumable_material, permanent_asset ou mixed.
- `operationalNature`: continuous, one_time, seasonal ou recurring.
- `executionComplexity`: low, medium ou high.
- `publicInterestProfile`: internal_administration, direct_public_service, institutional, social ou operational_support.
- `probableLegalPath`: dispensa, pregao, credenciamento, concorrencia ou undefined.
- `confidence`: 0 a 1.
- `reasoning`: sinais usados para classificar.

Defina `probableLegalPath` como `undefined` quando a SD não trouxer dado suficiente. Não presuma dispensa, pregão ou concorrência apenas pelo objeto.

Consulte `references/inference-rubric.md` quando a classificação for ambígua.

### 2. Comprimir o Objeto

Acione o Semantic Compression Engine:

- agrupe itens equivalentes por função administrativa;
- preserve itens, quantidades e valores na camada de fatos;
- reduza repetição literal;
- mantenha rastreabilidade entre síntese e SD;
- não apague itens relevantes para preço, escopo, fiscalização ou risco.

### 3. Inferir com Cautela

Depois da classificação, derive somente o que for compatível:

- finalidade administrativa;
- impacto institucional, social, operacional ou de serviço público;
- sensibilidade temporal, técnica, social, sanitária, patrimonial, financeira ou logística;
- necessidade de continuidade, disponibilidade, controle, rastreabilidade ou fiscalização;
- criticidade operacional;
- risco de execução;
- complexidade de recebimento, aceite, medição ou acompanhamento.

Marque cada inferência como `explicit`, `semantic_inference` ou `administrative_hypothesis`, com confiança e justificativa.

### 4. Registrar Pendências, Riscos e Alternativas

Pendências devem ser específicas e acionáveis. Se a SD de distribuição gratuita não informar público-alvo, registre público e critério de distribuição como pendências; não invente beneficiários.

Riscos devem ser proporcionais ao objeto:

- valor zerado ou ausente;
- descrição genérica;
- quantitativo sem memória de cálculo;
- entrega divergente;
- baixa qualidade;
- execução, medição, aceite ou fiscalização frágeis;
- falta de controle de entrega a beneficiários;
- perda de utilidade por data sensível.

Alternativas devem ser plausíveis para a classificação: manter solução com ajustes, ajustar escopo, parcelar, centralizar fornecimento, executar internamente, contratar apoio externo, adiar ou reformular.

### 5. Planejar Documentos

Gere planos distintos por tipo documental:

- **DFD**: curto, formalização inicial, sem estudo de mercado, sem riscos detalhados e sem análise profunda.
- **ETP**: analítico, proporcional à complexidade, com alternativas, riscos, estimativa, sustentabilidade quando compatível e gestão/fiscalização.
- **TR**: operacional, com especificações, execução, recebimento, obrigações, fiscalização, pagamento e aceite.
- **Minuta**: contratual, com placeholders, cláusulas fixas, linguagem jurídica, sem parecer e sem análise de viabilidade.

Use `references/context-package.md` quando precisar entregar o pacote completo de contexto enriquecido.

## Qualidade

O contexto enriquecido deve:

- interpretar semanticamente antes de inferir;
- variar profundidade conforme complexidade, risco e impacto;
- adaptar riscos, alternativas e tom ao objeto;
- reduzir repetição literal da SD;
- separar fato, inferência e pendência;
- manter comportamento anti-alucinação;
- registrar fragilidades reais antes de recomendar prosseguimento;
- permitir que Writer, Reviewer e Rewriter consumam o pacote sem refazer a inteligência.

## Anti-Padrões

Não:

- assumir natureza fixa de contratação;
- transformar ausência de dado em texto longo e abstrato;
- repetir a SD quase literalmente como análise;
- usar estrutura idêntica para todos os objetos;
- afirmar pesquisa de preços, economicidade, dotação, modalidade ou disponibilidade orçamentária sem evidência;
- deixar instructions/templates de DFD, ETP, TR ou Minuta responsáveis por classificação e inferência pesada.

## Saída Recomendada

Produza ou use internamente um `EnrichedContextPackage` com:

- source;
- facts;
- semanticObject;
- classification;
- inferences;
- pendingIssues;
- risks;
- alternatives;
- recommendedTone;
- documentPlan e/ou documentPlans;
- generationHints.

Mantenha a redação técnica, direta e revisável por equipe pública.
