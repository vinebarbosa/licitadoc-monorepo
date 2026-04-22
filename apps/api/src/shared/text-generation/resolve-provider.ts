import { OpenAiTextGenerationProvider } from "./openai-provider";
import { StubTextGenerationProvider } from "./stub-provider";
import { TextGenerationError, type TextGenerationProvider } from "./types";

type ResolveTextGenerationProviderInput = {
  apiKey?: string;
  model: string;
  providerKey: string;
};

export function resolveTextGenerationProvider({
  apiKey,
  model,
  providerKey,
}: ResolveTextGenerationProviderInput): TextGenerationProvider {
  const normalizedProviderKey = providerKey.trim().toLowerCase();

  if (normalizedProviderKey === "stub") {
    return new StubTextGenerationProvider(model);
  }

  if (normalizedProviderKey === "openai") {
    return new OpenAiTextGenerationProvider({
      apiKey,
      model,
    });
  }

  throw new TextGenerationError({
    code: "invalid_request",
    message: `Unsupported text generation provider: ${providerKey}.`,
    providerKey: normalizedProviderKey || "unknown",
    model,
  });
}
