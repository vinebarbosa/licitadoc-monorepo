import { OllamaTextGenerationProvider } from "./ollama-provider";
import { OpenAiTextGenerationProvider } from "./openai-provider";
import { StubTextGenerationProvider } from "./stub-provider";
import { TextGenerationError, type TextGenerationProvider } from "./types";

type ResolveTextGenerationProviderInput = {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  providerKey: string;
  timeoutMs?: number;
};

export function resolveTextGenerationProvider({
  apiKey,
  baseUrl,
  model,
  providerKey,
  timeoutMs,
}: ResolveTextGenerationProviderInput): TextGenerationProvider {
  const normalizedProviderKey = providerKey.trim().toLowerCase();

  if (normalizedProviderKey === "stub") {
    return new StubTextGenerationProvider(model);
  }

  if (normalizedProviderKey === "openai") {
    return new OpenAiTextGenerationProvider({
      apiKey,
      model,
      timeoutMs,
    });
  }

  if (normalizedProviderKey === "ollama") {
    return new OllamaTextGenerationProvider({
      baseUrl,
      model,
      timeoutMs,
    });
  }

  throw new TextGenerationError({
    code: "invalid_request",
    message: `Unsupported text generation provider: ${providerKey}.`,
    providerKey: normalizedProviderKey || "unknown",
    model,
  });
}
