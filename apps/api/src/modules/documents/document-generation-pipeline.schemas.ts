import { z } from "../../shared/http/zod";
import { supportedGeneratedDocumentTypes } from "../../shared/text-generation/types";

const nullableTextSchema = z.string().nullable();
const optionalNullableTextSchema = z.string().nullable().optional();
const recordSchema = z.record(z.string(), z.unknown());

export const normalizedSdItemComponentSchema = z
  .object({
    description: z.string(),
    quantity: z.number().nullable().optional(),
    rawQuantity: optionalNullableTextSchema,
    title: optionalNullableTextSchema,
    unit: optionalNullableTextSchema,
  })
  .strict();

export const normalizedSdItemSchema = z
  .object({
    code: optionalNullableTextSchema,
    components: z.array(normalizedSdItemComponentSchema).default([]),
    description: z.string(),
    kind: z.enum(["simple", "kit", "source"]).default("source"),
    quantity: z.number().nullable().optional(),
    rawQuantity: optionalNullableTextSchema,
    rawTotalValue: optionalNullableTextSchema,
    rawUnitValue: optionalNullableTextSchema,
    title: optionalNullableTextSchema,
    totalValue: z.number().nullable().optional(),
    unit: optionalNullableTextSchema,
    unitValue: z.number().nullable().optional(),
  })
  .strict();

export const extractedSdFactsSchema = z
  .object({
    budgetData: recordSchema.optional(),
    estimatedValue: z.number().nullable(),
    hasValidEstimatedValue: z.boolean(),
    items: z.array(normalizedSdItemSchema),
    justification: optionalNullableTextSchema,
    originalObject: optionalNullableTextSchema,
    sourceClassification: optionalNullableTextSchema,
  })
  .strict();

export const contextPackageSourceSchema = z
  .object({
    department: optionalNullableTextSchema,
    issuedAt: optionalNullableTextSchema,
    organization: optionalNullableTextSchema,
    processNumber: optionalNullableTextSchema,
    requestId: optionalNullableTextSchema,
    responsibleName: optionalNullableTextSchema,
    responsibleRole: optionalNullableTextSchema,
  })
  .strict();

export const procurementTypeSchema = z.enum([
  "goods",
  "service",
  "engineering",
  "event",
  "social_action",
  "continuous_service",
  "technical_service",
  "institutional_action",
  "consumable_material",
  "permanent_asset",
  "mixed",
]);

export const operationalNatureSchema = z.enum(["continuous", "one_time", "seasonal", "recurring"]);

export const executionComplexitySchema = z.enum(["low", "medium", "high"]);

export const publicInterestProfileSchema = z.enum([
  "internal_administration",
  "direct_public_service",
  "institutional",
  "social",
  "operational_support",
]);

export const probableLegalPathSchema = z.enum([
  "dispensa",
  "pregao",
  "credenciamento",
  "concorrencia",
  "undefined",
]);

export const procurementClassificationSchema = z
  .object({
    confidence: z.number().min(0).max(1),
    executionComplexity: executionComplexitySchema,
    operationalNature: operationalNatureSchema,
    probableLegalPath: probableLegalPathSchema,
    procurementType: procurementTypeSchema,
    publicInterestProfile: publicInterestProfileSchema,
    reasoning: z.string(),
  })
  .strict();

export const semanticObjectSchema = z
  .object({
    compressedDescription: z.string(),
    itemGroups: z.array(
      z
        .object({
          items: z.array(z.string()),
          label: z.string(),
          purpose: optionalNullableTextSchema,
        })
        .strict(),
    ),
  })
  .strict();

export const administrativeInferenceSchema = z
  .object({
    confidence: z.number().min(0).max(1),
    key: z.string(),
    reasoning: z.string(),
    source: z.enum(["explicit", "semantic_inference", "administrative_hypothesis"]),
    value: z.string(),
  })
  .strict();

export const pendingIssueSchema = z
  .object({
    description: z.string(),
    impact: z.string(),
    key: z.string(),
    recommendedAction: z.string(),
  })
  .strict();

export const documentRiskSchema = z
  .object({
    cause: optionalNullableTextSchema,
    impact: z.string(),
    mitigation: z.string(),
    risk: z.string(),
    severity: z.enum(["low", "medium", "high"]),
  })
  .strict();

export const documentAlternativeSchema = z
  .object({
    adoptionCondition: optionalNullableTextSchema,
    advantages: z.array(z.string()),
    description: z.string(),
    limitations: z.array(z.string()),
    title: z.string(),
  })
  .strict();

export const documentPlanSchema = z
  .object({
    avoid: z.array(z.string()),
    documentType: z.enum(["DFD", "ETP", "TR", "MINUTA"]),
    focusAreas: z.array(z.string()),
    generationHints: z.array(z.string()),
    recommendedDepth: z.enum(["simplified", "standard", "robust"]),
  })
  .strict();

export const writerStyleSchema = z.enum([
  "dry_legal",
  "administrative",
  "technical",
  "operational",
  "institutional",
]);

export const documentPlansSchema = z
  .object({
    DFD: documentPlanSchema,
    ETP: documentPlanSchema,
    TR: documentPlanSchema,
    MINUTA: documentPlanSchema,
  })
  .strict();

export const enrichedContextPackageSchema = z
  .object({
    alternatives: z.array(documentAlternativeSchema),
    classification: procurementClassificationSchema,
    documentPlan: documentPlanSchema,
    documentPlans: documentPlansSchema,
    facts: extractedSdFactsSchema,
    generationHints: z.array(z.string()),
    inferences: z.array(administrativeInferenceSchema),
    pendingIssues: z.array(pendingIssueSchema),
    recommendedTone: z.string(),
    risks: z.array(documentRiskSchema),
    semanticObject: semanticObjectSchema,
    source: contextPackageSourceSchema,
  })
  .strict();

export const documentReviewIssueSchema = z
  .object({
    instruction: z.string(),
    problem: z.string(),
    section: optionalNullableTextSchema,
    severity: z.enum(["low", "medium", "high"]),
    type: z.enum([
      "hallucination",
      "missing_context",
      "wrong_document_role",
      "excessive_repetition",
      "generic_text",
      "overly_defensive",
      "insufficient_depth",
      "excessive_depth",
      "invalid_value_handling",
      "template_violation",
      "signature_problem",
      "poor_alternatives",
      "poor_risks",
      "meta_language",
      "excessive_defensiveness",
    ]),
  })
  .strict();

export const documentReviewResultSchema = z
  .object({
    globalRevisionInstructions: z.array(z.string()),
    issues: z.array(documentReviewIssueSchema),
    score: z.number().min(0).max(1),
    status: z.enum(["approved", "needs_revision"]),
  })
  .strict();

export const documentRewriteAttemptSchema = z
  .object({
    draft: z.string(),
    review: documentReviewResultSchema,
    revisionNumber: z.number().int().min(1).max(2),
  })
  .strict();

export const documentHumanizationResultSchema = z
  .object({
    draft: nullableTextSchema.optional(),
    reason: optionalNullableTextSchema,
    status: z.enum(["applied", "skipped", "failed"]),
  })
  .strict();

export const sdDocumentIntelligenceContractMetadataSchema = z
  .object({
    classificationFields: z.array(z.string()),
    contractDigest: z.string(),
    documentRoles: z
      .object({
        DFD: z.string(),
        ETP: z.string(),
        MINUTA: z.string(),
        TR: z.string(),
      })
      .strict(),
    name: z.literal("sd-document-intelligence"),
    sourceDigest: z.string(),
    sourcePath: z.string(),
    stageOrder: z.array(z.string()),
    version: z.string(),
  })
  .strict();

export const documentGenerationPipelineDebugSchema = z
  .object({
    documentPlan: documentPlanSchema,
    enrichedContext: enrichedContextPackageSchema,
    extractedFacts: extractedSdFactsSchema,
    finalDraft: nullableTextSchema.optional(),
    firstDraft: nullableTextSchema.optional(),
    humanization: documentHumanizationResultSchema.optional(),
    reviewResults: z.array(documentReviewResultSchema).default([]),
    rewriteAttempts: z.array(documentRewriteAttemptSchema).default([]),
    skillContract: sdDocumentIntelligenceContractMetadataSchema,
    status: z.enum(["planned", "completed", "failed"]).default("planned"),
    writerStyle: writerStyleSchema.optional(),
  })
  .strict();

export const pipelineDocumentTypeSchema = z.enum(supportedGeneratedDocumentTypes);

export type NormalizedSdItem = z.output<typeof normalizedSdItemSchema>;
export type ExtractedSdFacts = z.output<typeof extractedSdFactsSchema>;
export type ProcurementClassification = z.output<typeof procurementClassificationSchema>;
export type DocumentPlan = z.output<typeof documentPlanSchema>;
export type WriterStyle = z.output<typeof writerStyleSchema>;
export type EnrichedContextPackage = z.output<typeof enrichedContextPackageSchema>;
export type DocumentReviewIssue = z.output<typeof documentReviewIssueSchema>;
export type DocumentReviewResult = z.output<typeof documentReviewResultSchema>;
export type DocumentRewriteAttempt = z.output<typeof documentRewriteAttemptSchema>;
export type DocumentHumanizationResult = z.output<typeof documentHumanizationResultSchema>;
export type SdDocumentIntelligenceContractMetadata = z.output<
  typeof sdDocumentIntelligenceContractMetadataSchema
>;
export type DocumentGenerationPipelineDebug = z.output<
  typeof documentGenerationPipelineDebugSchema
>;
