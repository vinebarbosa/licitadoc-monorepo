import type {
  TextGenerationError,
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
} from "./types";
import { TextGenerationError as ProviderError } from "./types";

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_TIMEOUT_MS = 2_000_000;

type OllamaGenerateResponse = {
  done?: boolean;
  model?: string;
  response?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
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

export class OllamaTextGenerationProvider implements TextGenerationProvider {
  readonly baseUrl: string;
  readonly model: string;
  readonly providerKey = "ollama";
  readonly timeoutMs: number;

  constructor({
    baseUrl,
    model,
    timeoutMs,
  }: { baseUrl?: string; model: string; timeoutMs?: number }) {
    this.baseUrl = baseUrl?.trim() ? baseUrl.trim().replace(/\/$/, "") : DEFAULT_BASE_URL;
    this.model = model;
    this.timeoutMs = timeoutMs ?? DEFAULT_OLLAMA_TIMEOUT_MS;
  }

  async generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: input.prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      const body = (await response.json()) as OllamaGenerateResponse;

      if (!response.ok) {
        const details = {
          status: response.status,
          error: body.error ?? null,
        };

        if (response.status >= 400 && response.status < 500) {
          throw toError({
            code: "invalid_request",
            message: body.error ?? "Provider rejected the generation request.",
            providerKey: this.providerKey,
            model: this.model,
            details,
          });
        }

        throw toError({
          code: "provider_unavailable",
          message: body.error ?? "Provider is unavailable.",
          providerKey: this.providerKey,
          model: this.model,
          details,
        });
      }

      const text = typeof body.response === "string" ? body.response.trim() : "";

      if (!text) {
        throw toError({
          code: "provider_unavailable",
          message: "Provider returned an empty response.",
          providerKey: this.providerKey,
          model: this.model,
          details: {
            done: body.done ?? null,
          },
        });
      }

      return {
        providerKey: this.providerKey,
        model: this.model,
        text,
        responseMetadata: {
          done: body.done ?? null,
          total_duration: body.total_duration ?? null,
          load_duration: body.load_duration ?? null,
          prompt_eval_count: body.prompt_eval_count ?? null,
          eval_count: body.eval_count ?? null,
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

      // Connection failures (ECONNREFUSED, fetch network errors)
      throw toError({
        code: "provider_unavailable",
        message: "Could not connect to the Ollama service.",
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
