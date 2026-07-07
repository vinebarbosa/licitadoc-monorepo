import {
  normalizeTextGenerationUsage,
  type TextGenerationUsage,
} from "../../shared/text-generation/usage-cost";

export type AiUsageRunMetadataInput = {
  createdAt: Date;
  documentOrganizationId?: string | null;
  documentType?: string | null;
  fallbackDocumentType?: string | null;
  fallbackOrganizationId?: string | null;
  finishedAt?: Date | null;
  requestMetadata: Record<string, unknown>;
  responseMetadata: Record<string, unknown> | null;
  startedAt: Date;
};

export type NormalizedAiUsageMetadata = {
  callCount: number;
  costKnown: boolean;
  costUsd: number | null;
  documentType: string;
  occurredAt: Date;
  organizationId: string | null;
  usage: TextGenerationUsage;
};

const ZERO_USAGE = normalizeTextGenerationUsage(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNullableFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function getNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getPipelineMetadata(responseMetadata: Record<string, unknown> | null) {
  if (!responseMetadata || !isRecord(responseMetadata.pipeline)) {
    return null;
  }

  return responseMetadata.pipeline;
}

function getPipelineUsage(pipeline: Record<string, unknown> | null): TextGenerationUsage | null {
  if (!pipeline) {
    return null;
  }

  const totalInputTokens = getNullableFiniteNumber(pipeline.totalInputTokens);
  const totalOutputTokens = getNullableFiniteNumber(pipeline.totalOutputTokens);
  const totalTokens = getNullableFiniteNumber(pipeline.totalTokens);
  const totalCachedInputTokens = getNullableFiniteNumber(pipeline.totalCachedInputTokens);

  if (
    totalInputTokens === null &&
    totalOutputTokens === null &&
    totalTokens === null &&
    totalCachedInputTokens === null
  ) {
    return null;
  }

  const inputTokens = Math.trunc(totalInputTokens ?? 0);
  const outputTokens = Math.trunc(totalOutputTokens ?? 0);

  return {
    input_tokens: inputTokens,
    input_tokens_details: {
      cached_tokens: Math.trunc(totalCachedInputTokens ?? 0),
    },
    output_tokens: outputTokens,
    output_tokens_details: {
      reasoning_tokens: 0,
    },
    total_tokens: Math.trunc(totalTokens ?? inputTokens + outputTokens),
  };
}

function getPipelineCallCount(pipeline: Record<string, unknown> | null) {
  const callCount = getNullableFiniteNumber(pipeline?.callCount);

  if (callCount !== null) {
    return Math.trunc(callCount);
  }

  if (Array.isArray(pipeline?.calls)) {
    return pipeline.calls.length;
  }

  return null;
}

export function normalizeAiUsageRunMetadata({
  createdAt,
  documentOrganizationId,
  documentType,
  fallbackDocumentType,
  fallbackOrganizationId,
  finishedAt,
  requestMetadata,
  responseMetadata,
  startedAt,
}: AiUsageRunMetadataInput): NormalizedAiUsageMetadata {
  const pipeline = getPipelineMetadata(responseMetadata);
  const pipelineCostUsd = getNullableFiniteNumber(pipeline?.totalCostUsd);
  const finalCallCostUsd = getNullableFiniteNumber(responseMetadata?.costUsd);
  const costUsd = pipelineCostUsd ?? finalCallCostUsd;
  const pipelineUsage = getPipelineUsage(pipeline);
  const finalCallUsage = responseMetadata
    ? normalizeTextGenerationUsage(responseMetadata.usage)
    : ZERO_USAGE;
  const usage = pipelineUsage ?? finalCallUsage;
  const callCount = getPipelineCallCount(pipeline) ?? (responseMetadata ? 1 : 0);
  const normalizedDocumentType =
    documentType ??
    fallbackDocumentType ??
    getNullableString(requestMetadata.documentType) ??
    "unknown";
  const organizationId =
    documentOrganizationId ??
    fallbackOrganizationId ??
    getNullableString(requestMetadata.organizationId) ??
    null;

  return {
    callCount,
    costKnown: costUsd !== null,
    costUsd,
    documentType: normalizedDocumentType,
    occurredAt: finishedAt ?? startedAt ?? createdAt,
    organizationId,
    usage,
  };
}
