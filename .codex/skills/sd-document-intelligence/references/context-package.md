# Pacote de Contexto Enriquecido

Use este formato como contrato canônico entre Context Enrichment Agent, Document Planning Agent, Writer, Reviewer e Rewriter.

O pacote deve ser document-neutral: ele não deve parecer DFD, ETP, TR ou Minuta. Ele organiza fatos, classificação, inferências, pendências e planejamento para que cada documento use apenas a parte adequada ao seu papel.

## Schema Conceitual

```ts
type EnrichedContextPackage = {
  source: {
    requestId?: string | null
    processNumber?: string | null
    issuedAt?: string | null
    organization?: string | null
    department?: string | null
    responsibleName?: string | null
    responsibleRole?: string | null
  }

  facts: {
    originalObject?: string | null
    justification?: string | null
    items: Array<{
      code?: string | null
      title?: string | null
      description: string
      kind?: "simple" | "kit" | "source"
      quantity?: number | null
      rawQuantity?: string | null
      unit?: string | null
      unitValue?: number | null
      rawUnitValue?: string | null
      totalValue?: number | null
      rawTotalValue?: string | null
      components?: Array<{
        title?: string | null
        description: string
        quantity?: number | null
        rawQuantity?: string | null
        unit?: string | null
      }>
    }>
    estimatedValue?: number | null
    hasValidEstimatedValue: boolean
    budgetData?: Record<string, unknown>
    sourceClassification?: string | null
  }

  semanticObject: {
    compressedDescription: string
    itemGroups: Array<{
      label: string
      items: string[]
      purpose?: string | null
    }>
  }

  classification: {
    procurementType:
      | "goods"
      | "service"
      | "engineering"
      | "event"
      | "social_action"
      | "continuous_service"
      | "technical_service"
      | "institutional_action"
      | "consumable_material"
      | "permanent_asset"
      | "mixed"
    operationalNature: "continuous" | "one_time" | "seasonal" | "recurring"
    executionComplexity: "low" | "medium" | "high"
    publicInterestProfile:
      | "internal_administration"
      | "direct_public_service"
      | "institutional"
      | "social"
      | "operational_support"
    probableLegalPath:
      | "dispensa"
      | "pregao"
      | "credenciamento"
      | "concorrencia"
      | "undefined"
    confidence: number
    reasoning: string
  }

  inferences: Array<{
    key: string
    value: string
    confidence: number
    source: "explicit" | "semantic_inference" | "administrative_hypothesis"
    reasoning: string
  }>

  pendingIssues: Array<{
    key: string
    description: string
    impact: string
    recommendedAction: string
  }>

  risks: Array<{
    risk: string
    cause?: string | null
    impact: string
    mitigation: string
    severity: "low" | "medium" | "high"
  }>

  alternatives: Array<{
    title: string
    description: string
    advantages: string[]
    limitations: string[]
    adoptionCondition?: string | null
  }>

  recommendedTone: string

  documentPlan: DocumentPlan
  documentPlans?: Record<"DFD" | "ETP" | "TR" | "MINUTA", DocumentPlan>
  generationHints: string[]
}

type DocumentPlan = {
  documentType: "DFD" | "ETP" | "TR" | "MINUTA"
  recommendedDepth: "simplified" | "standard" | "robust"
  focusAreas: string[]
  avoid: string[]
  generationHints: string[]
}
```

## Regras de Preenchimento

- Preserve a lista completa de itens em `facts.items`.
- Use `semanticObject` para síntese e agrupamento, não para substituir fatos.
- Defina `hasValidEstimatedValue` como `false` para valor ausente ou zerado (`0`, `0,00`, `0.00`, `R$ 0,00`).
- Inclua `reasoning` na classificação, mas mantenha curto.
- Não promova hipótese administrativa a fato.
- Transforme lacunas em `pendingIssues`, não em texto inventado.
- Gere riscos e alternativas compatíveis com `classification`.
- Use `documentPlans` quando o pipeline precisar planejar todos os documentos; use `documentPlan` para o documento solicitado.

## Planejamento por Documento

- DFD: foco em formalização inicial, objeto, justificativa e requisitos essenciais; evitar mercado, riscos detalhados e execução.
- ETP: foco em necessidade, alternativas, riscos, estimativa, sustentabilidade quando compatível, gestão e fiscalização.
- TR: foco em especificações, execução, recebimento, obrigações, fiscalização, pagamento e aceite.
- Minuta: foco em partes, cláusulas, placeholders, preço, execução, obrigações, fiscalização, recebimento, sanções e assinaturas.

## Limites

- Não usar o pacote para concluir modalidade, legalidade, economicidade ou disponibilidade orçamentária sem suporte.
- Não ocultar item relevante durante a compressão semântica.
- Não forçar profundidade robusta em aquisição simples.
- Não fazer DFD virar ETP, ETP virar TR, TR virar Minuta, ou Minuta virar estudo técnico.
