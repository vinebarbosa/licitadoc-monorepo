export type TextGenerationUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details: {
    cached_tokens: number;
  };
  output_tokens_details: {
    reasoning_tokens: number;
  };
};

type OpenAiModelPricing = {
  cachedInputUsdPerMillion: number;
  inputUsdPerMillion: number;
  longContext?: {
    inputTokenThreshold: number;
    inputMultiplier: number;
    outputMultiplier: number;
  };
  outputUsdPerMillion: number;
};

const ZERO_USAGE: TextGenerationUsage = {
  input_tokens: 0,
  input_tokens_details: {
    cached_tokens: 0,
  },
  output_tokens: 0,
  output_tokens_details: {
    reasoning_tokens: 0,
  },
  total_tokens: 0,
};

const OPENAI_MODEL_PRICING: Record<string, OpenAiModelPricing> = {
  "gpt-4.1": {
    cachedInputUsdPerMillion: 0.5,
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 8,
  },
  "gpt-4.1-2025-04-14": {
    cachedInputUsdPerMillion: 0.5,
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 8,
  },
  "gpt-4.1-mini": {
    cachedInputUsdPerMillion: 0.1,
    inputUsdPerMillion: 0.4,
    outputUsdPerMillion: 1.6,
  },
  "gpt-4.1-mini-2025-04-14": {
    cachedInputUsdPerMillion: 0.1,
    inputUsdPerMillion: 0.4,
    outputUsdPerMillion: 1.6,
  },
  "gpt-5.5": {
    cachedInputUsdPerMillion: 0.5,
    inputUsdPerMillion: 5,
    longContext: {
      inputMultiplier: 2,
      inputTokenThreshold: 272_000,
      outputMultiplier: 1.5,
    },
    outputUsdPerMillion: 30,
  },
  "gpt-5.5-2026-04-23": {
    cachedInputUsdPerMillion: 0.5,
    inputUsdPerMillion: 5,
    longContext: {
      inputMultiplier: 2,
      inputTokenThreshold: 272_000,
      outputMultiplier: 1.5,
    },
    outputUsdPerMillion: 30,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTokenCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.trunc(value);
}

function roundUsd(value: number) {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

export function normalizeTextGenerationUsage(value: unknown): TextGenerationUsage {
  if (!isRecord(value)) {
    return ZERO_USAGE;
  }

  const inputTokens = normalizeTokenCount(value.input_tokens);
  const outputTokens = normalizeTokenCount(value.output_tokens);
  const inputTokenDetails = isRecord(value.input_tokens_details) ? value.input_tokens_details : {};
  const outputTokenDetails = isRecord(value.output_tokens_details)
    ? value.output_tokens_details
    : {};
  const totalTokens = normalizeTokenCount(value.total_tokens);

  return {
    input_tokens: inputTokens,
    input_tokens_details: {
      cached_tokens: normalizeTokenCount(inputTokenDetails.cached_tokens),
    },
    output_tokens: outputTokens,
    output_tokens_details: {
      reasoning_tokens: normalizeTokenCount(outputTokenDetails.reasoning_tokens),
    },
    total_tokens: totalTokens > 0 ? totalTokens : inputTokens + outputTokens,
  };
}

export function calculateOpenAiTextGenerationCostUsd({
  model,
  usage,
}: {
  model: string;
  usage: TextGenerationUsage;
}) {
  const pricing = OPENAI_MODEL_PRICING[model];

  if (!pricing) {
    return null;
  }

  const cachedInputTokens = Math.min(usage.input_tokens, usage.input_tokens_details.cached_tokens);
  const standardInputTokens = Math.max(usage.input_tokens - cachedInputTokens, 0);
  const inputMultiplier =
    pricing.longContext && usage.input_tokens > pricing.longContext.inputTokenThreshold
      ? pricing.longContext.inputMultiplier
      : 1;
  const outputMultiplier =
    pricing.longContext && usage.input_tokens > pricing.longContext.inputTokenThreshold
      ? pricing.longContext.outputMultiplier
      : 1;
  const costUsd =
    (standardInputTokens / 1_000_000) * pricing.inputUsdPerMillion * inputMultiplier +
    (cachedInputTokens / 1_000_000) * pricing.cachedInputUsdPerMillion * inputMultiplier +
    (usage.output_tokens / 1_000_000) * pricing.outputUsdPerMillion * outputMultiplier;

  return roundUsd(costUsd);
}
