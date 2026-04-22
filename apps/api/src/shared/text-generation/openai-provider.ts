import type {
  TextGenerationError,
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
} from "./types";
import { TextGenerationError as ProviderError } from "./types";

type OpenAiResponse = {
  error?: {
    code?: string | null;
    message?: string;
    type?: string | null;
  };
  id?: string;
  model?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  output_text?: string;
  status?: string;
};

function toError(input: {
  code: TextGenerationError["code"];
  message: string;
  providerKey: string;
  model: string;
  details?: Record<string, unknown> | null;
}) {
  return new ProviderError({
    code: input.code,
    message: input.message,
    providerKey: input.providerKey,
    model: input.model,
    details: input.details ?? null,
  });
}

function extractOutputText(body: OpenAiResponse) {
  if (typeof body.output_text === "string" && body.output_text.trim().length > 0) {
    return body.output_text.trim();
  }

  const fragments: string[] = [];

  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        fragments.push(content.text);
      }
    }
  }

  return fragments.join("\n").trim();
}

export class OpenAiTextGenerationProvider implements TextGenerationProvider {
  readonly apiKey: string | null;
  readonly model: string;
  readonly providerKey = "openai";

  constructor({ apiKey, model }: { apiKey?: string; model: string }) {
    this.apiKey = apiKey?.trim() ? apiKey.trim() : null;
    this.model = model;
  }

  async generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
    if (!this.apiKey) {
      throw toError({
        code: "authentication_failed",
        message: "Text generation API key is not configured.",
        providerKey: this.providerKey,
        model: this.model,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: input.prompt,
        }),
        signal: controller.signal,
      });

      const body = (await response.json()) as OpenAiResponse;

      if (!response.ok) {
        const details = {
          status: response.status,
          type: body.error?.type ?? null,
          vendorCode: body.error?.code ?? null,
        };

        if (response.status === 401) {
          throw toError({
            code: "authentication_failed",
            message: body.error?.message ?? "Provider authentication failed.",
            providerKey: this.providerKey,
            model: this.model,
            details,
          });
        }

        if (response.status === 429) {
          throw toError({
            code: "rate_limited",
            message: body.error?.message ?? "Provider rate limit exceeded.",
            providerKey: this.providerKey,
            model: this.model,
            details,
          });
        }

        if (response.status >= 500) {
          throw toError({
            code: "provider_unavailable",
            message: body.error?.message ?? "Provider is unavailable.",
            providerKey: this.providerKey,
            model: this.model,
            details,
          });
        }

        throw toError({
          code: "invalid_request",
          message: body.error?.message ?? "Provider rejected the generation request.",
          providerKey: this.providerKey,
          model: this.model,
          details,
        });
      }

      const text = extractOutputText(body);

      if (!text) {
        throw toError({
          code: "provider_unavailable",
          message: "Provider returned an empty response.",
          providerKey: this.providerKey,
          model: this.model,
          details: {
            responseId: body.id ?? null,
            status: body.status ?? null,
          },
        });
      }

      return {
        providerKey: this.providerKey,
        model: this.model,
        text,
        responseMetadata: {
          responseId: body.id ?? null,
          status: body.status ?? null,
        },
      };
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw toError({
          code: "timeout",
          message: "Provider request timed out.",
          providerKey: this.providerKey,
          model: this.model,
        });
      }

      throw toError({
        code: "unknown",
        message: "Unexpected provider failure.",
        providerKey: this.providerKey,
        model: this.model,
        details:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : null,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
