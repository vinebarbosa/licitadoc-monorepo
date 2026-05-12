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
  thinking?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
};

type OllamaResponseMetadata = Pick<
  OllamaGenerateResponse,
  "done" | "total_duration" | "load_duration" | "prompt_eval_count" | "eval_count"
>;

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

function updateMetadata(
  metadata: OllamaResponseMetadata,
  chunk: OllamaGenerateResponse,
): OllamaResponseMetadata {
  return {
    done: chunk.done ?? metadata.done,
    total_duration: chunk.total_duration ?? metadata.total_duration,
    load_duration: chunk.load_duration ?? metadata.load_duration,
    prompt_eval_count: chunk.prompt_eval_count ?? metadata.prompt_eval_count,
    eval_count: chunk.eval_count ?? metadata.eval_count,
  };
}

async function readOllamaErrorBody(response: Response) {
  try {
    const raw = await response.text();
    const trimmed = raw.trim();

    if (!trimmed) {
      return { error: null, raw: null };
    }

    try {
      const parsed = JSON.parse(trimmed) as OllamaGenerateResponse;
      return {
        error: typeof parsed.error === "string" ? parsed.error : null,
        raw: trimmed,
      };
    } catch {
      return { error: null, raw: trimmed };
    }
  } catch {
    return { error: null, raw: null };
  }
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
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: input.prompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        const body = await readOllamaErrorBody(response);
        const details = {
          status: response.status,
          error: body.error ?? null,
          raw: body.raw ?? null,
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

      if (!response.body) {
        throw toError({
          code: "provider_unavailable",
          message: "Provider returned a response without a readable stream.",
          providerKey: this.providerKey,
          model: this.model,
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const textParts: string[] = [];
      let metadata: OllamaResponseMetadata = {};
      let bufferedLine = "";

      const handleLine = async (line: string) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          return;
        }

        let chunk: OllamaGenerateResponse;

        try {
          chunk = JSON.parse(trimmedLine) as OllamaGenerateResponse;
        } catch (error) {
          throw toError({
            code: "provider_unavailable",
            message: "Provider returned malformed streaming data.",
            providerKey: this.providerKey,
            model: this.model,
            details: {
              line: trimmedLine,
              error:
                error instanceof Error
                  ? {
                      name: error.name,
                      message: error.message,
                    }
                  : null,
            },
          });
        }

        if (typeof chunk.error === "string" && chunk.error.trim()) {
          throw toError({
            code: "provider_unavailable",
            message: chunk.error,
            providerKey: this.providerKey,
            model: this.model,
            details: {
              error: chunk.error,
              done: chunk.done ?? null,
            },
          });
        }

        if (typeof chunk.thinking === "string" && chunk.thinking.length > 0) {
          await input.onPlanningChunk?.({
            planningDelta: chunk.thinking,
            metadata: {
              done: chunk.done ?? null,
              model: chunk.model ?? null,
            },
          });
        }

        if (typeof chunk.response === "string") {
          textParts.push(chunk.response);
          if (chunk.response.length > 0) {
            await input.onChunk?.({
              textDelta: chunk.response,
              metadata: {
                done: chunk.done ?? null,
                model: chunk.model ?? null,
              },
            });
          }
        }

        metadata = updateMetadata(metadata, chunk);
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        bufferedLine += decoder.decode(value, { stream: true });
        const lines = bufferedLine.split("\n");
        bufferedLine = lines.pop() ?? "";

        for (const line of lines) {
          await handleLine(line);
        }
      }

      bufferedLine += decoder.decode();

      if (bufferedLine.trim()) {
        await handleLine(bufferedLine);
      }

      const text = textParts.join("").trim();

      if (!text) {
        throw toError({
          code: "provider_unavailable",
          message: "Provider returned an empty response.",
          providerKey: this.providerKey,
          model: this.model,
          details: {
            done: metadata.done ?? null,
          },
        });
      }

      return {
        providerKey: this.providerKey,
        model: this.model,
        text,
        responseMetadata: {
          done: metadata.done ?? null,
          total_duration: metadata.total_duration ?? null,
          load_duration: metadata.load_duration ?? null,
          prompt_eval_count: metadata.prompt_eval_count ?? null,
          eval_count: metadata.eval_count ?? null,
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
    }
  }
}
