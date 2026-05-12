import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";
import { parseApiEnv } from "../../plugins/env";
import { OllamaTextGenerationProvider } from "./ollama-provider";
import { OpenAiTextGenerationProvider } from "./openai-provider";
import { resolveTextGenerationProvider } from "./resolve-provider";
import { StubTextGenerationProvider } from "./stub-provider";
import { TextGenerationError } from "./types";

const generationInput = {
  documentType: "dfd" as const,
  prompt: "Gere um DFD de teste.",
  subject: {
    documentId: "123e4567-e89b-12d3-a456-426614174000",
    organizationId: "123e4567-e89b-12d3-a456-426614174001",
    processId: "123e4567-e89b-12d3-a456-426614174002",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function createOllamaStream(chunks: string[]) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

test("resolveTextGenerationProvider selects supported providers", () => {
  const stubProvider = resolveTextGenerationProvider({
    providerKey: "stub",
    model: "stub-model",
  });
  const openAiProvider = resolveTextGenerationProvider({
    providerKey: "openai",
    model: "gpt-test",
    apiKey: "test-key",
    timeoutMs: 300_000,
  });

  assert.equal(stubProvider.providerKey, "stub");
  assert.equal(stubProvider.model, "stub-model");
  assert.equal(openAiProvider.providerKey, "openai");
  assert.equal(openAiProvider.model, "gpt-test");
  assert.equal((openAiProvider as OpenAiTextGenerationProvider).timeoutMs, 300_000);
});

test("resolveTextGenerationProvider rejects unsupported providers", () => {
  assert.throws(
    () =>
      resolveTextGenerationProvider({
        providerKey: "unknown-provider",
        model: "gpt-test",
      }),
    TextGenerationError,
  );
});

test("OpenAiTextGenerationProvider normalizes missing API keys as authentication failures", async () => {
  const provider = new OpenAiTextGenerationProvider({
    model: "gpt-test",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "authentication_failed",
    providerKey: "openai",
  });
});

test("OpenAiTextGenerationProvider uses configured timeout or default fallback", () => {
  const defaultProvider = new OpenAiTextGenerationProvider({
    apiKey: "test-key",
    model: "gpt-test",
  });
  const configuredProvider = new OpenAiTextGenerationProvider({
    apiKey: "test-key",
    model: "gpt-test",
    timeoutMs: 300_000,
  });

  assert.equal(defaultProvider.timeoutMs, 2_000_000);
  assert.equal(configuredProvider.timeoutMs, 300_000);
});

test("OpenAiTextGenerationProvider normalizes rate-limit responses", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              message: "Too many requests",
              type: "rate_limit_error",
              code: "rate_limit_exceeded",
            },
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    ),
  );

  const provider = new OpenAiTextGenerationProvider({
    apiKey: "test-key",
    model: "gpt-test",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "rate_limited",
    providerKey: "openai",
    model: "gpt-test",
  });
});

test("OpenAiTextGenerationProvider normalizes timeout failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    }),
  );

  const provider = new OpenAiTextGenerationProvider({
    apiKey: "test-key",
    model: "gpt-test",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "timeout",
    providerKey: "openai",
    model: "gpt-test",
  });
});

test("OpenAiTextGenerationProvider remains compatible with incremental callbacks", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: "response_123",
            status: "completed",
            output_text: "Documento gerado pela OpenAI.",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    ),
  );

  const chunks: string[] = [];
  const provider = new OpenAiTextGenerationProvider({
    apiKey: "test-key",
    model: "gpt-test",
  });

  const result = await provider.generateText({
    ...generationInput,
    onChunk: (chunk) => {
      chunks.push(chunk.textDelta);
    },
  });

  assert.deepEqual(chunks, ["Documento gerado pela OpenAI."]);
  assert.equal(result.text, "Documento gerado pela OpenAI.");
});

test("StubTextGenerationProvider remains compatible with incremental callbacks", async () => {
  const chunks: string[] = [];
  const provider = new StubTextGenerationProvider("stub-model");

  const result = await provider.generateText({
    ...generationInput,
    onChunk: (chunk) => {
      chunks.push(chunk.textDelta);
    },
  });

  assert.deepEqual(chunks, [result.text]);
  assert.match(result.text, /Documento DFD/);
});

// ─── Ollama provider tests ────────────────────────────────────────────────────

test("resolveTextGenerationProvider selects ollama with model and base URL", () => {
  const ollamaProvider = resolveTextGenerationProvider({
    providerKey: "ollama",
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
    timeoutMs: 300_000,
  });

  assert.equal(ollamaProvider.providerKey, "ollama");
  assert.equal(ollamaProvider.model, "qwen3.6:35b");
  assert.equal((ollamaProvider as OllamaTextGenerationProvider).timeoutMs, 300_000);
});

test("resolveTextGenerationProvider selects ollama with default base URL when omitted", () => {
  const ollamaProvider = resolveTextGenerationProvider({
    providerKey: "ollama",
    model: "qwen3.6:35b",
  }) as OllamaTextGenerationProvider;

  assert.equal(ollamaProvider.providerKey, "ollama");
  assert.equal(ollamaProvider.baseUrl, "http://127.0.0.1:11434");
  assert.equal(ollamaProvider.timeoutMs, 2_000_000);
});

test("OllamaTextGenerationProvider uses configured timeout or default fallback", () => {
  const defaultProvider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });
  const configuredProvider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
    timeoutMs: 300_000,
  });

  assert.equal(defaultProvider.timeoutMs, 2_000_000);
  assert.equal(configuredProvider.timeoutMs, 300_000);
});

test("parseApiEnv accepts a positive text generation timeout", () => {
  const parsedEnv = parseApiEnv({
    TEXT_GENERATION_TIMEOUT_MS: "300000",
  });

  assert.equal(parsedEnv.TEXT_GENERATION_TIMEOUT_MS, 300_000);
});

test("parseApiEnv rejects invalid text generation timeouts", () => {
  assert.throws(() =>
    parseApiEnv({
      TEXT_GENERATION_TIMEOUT_MS: "0",
    }),
  );
  assert.throws(() =>
    parseApiEnv({
      TEXT_GENERATION_TIMEOUT_MS: "not-a-number",
    }),
  );
});

test("OllamaTextGenerationProvider normalizes successful response and metadata", async () => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(
        createOllamaStream([
          `${JSON.stringify({
            model: "qwen3.6:35b",
            response: "Documento ",
            done: false,
          })}\n`,
          `${JSON.stringify({
            model: "qwen3.6:35b",
            response: "gerado pelo Ollama.",
            done: true,
            total_duration: 12345678,
            load_duration: 1000000,
            prompt_eval_count: 20,
            eval_count: 50,
          })}\n`,
        ]),
        {
          status: 200,
          headers: { "content-type": "application/x-ndjson" },
        },
      ),
  );

  vi.stubGlobal("fetch", fetchMock);

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });
  const chunks: string[] = [];

  const result = await provider.generateText({
    ...generationInput,
    onChunk: (chunk) => {
      chunks.push(chunk.textDelta);
    },
  });
  const [, requestInit] = fetchMock.mock.calls[0] ?? [];
  const requestBody = JSON.parse(String(requestInit?.body)) as {
    model: string;
    prompt: string;
    stream: boolean;
    think?: boolean;
  };

  assert.equal(requestBody.model, "qwen3.6:35b");
  assert.equal(requestBody.prompt, generationInput.prompt);
  assert.equal(requestBody.stream, true);
  assert.notEqual(requestBody.think, false);
  assert.deepEqual(chunks, ["Documento ", "gerado pelo Ollama."]);
  assert.equal(result.providerKey, "ollama");
  assert.equal(result.model, "qwen3.6:35b");
  assert.equal(result.text, "Documento gerado pelo Ollama.");
  assert.equal(result.responseMetadata.done, true);
  assert.equal(result.responseMetadata.total_duration, 12345678);
  assert.equal(result.responseMetadata.load_duration, 1000000);
  assert.equal(result.responseMetadata.prompt_eval_count, 20);
  assert.equal(result.responseMetadata.eval_count, 50);
});

test("OllamaTextGenerationProvider buffers streamed JSON split across reads", async () => {
  const firstLine = `${JSON.stringify({
    model: "qwen3.6:35b",
    response: "Documento ",
    done: false,
  })}\n`;
  const secondLine = `${JSON.stringify({
    model: "qwen3.6:35b",
    response: "com linha fracionada.",
    done: true,
  })}\n`;
  const splitIndex = Math.floor(secondLine.length / 2);

  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          createOllamaStream([
            firstLine,
            secondLine.slice(0, splitIndex),
            secondLine.slice(splitIndex),
          ]),
          {
            status: 200,
            headers: { "content-type": "application/x-ndjson" },
          },
        ),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  const result = await provider.generateText(generationInput);

  assert.equal(result.text, "Documento com linha fracionada.");
  assert.equal(result.responseMetadata.done, true);
});

test("OllamaTextGenerationProvider emits thinking-only chunks as planning progress", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          createOllamaStream([
            `${JSON.stringify({
              model: "qwen3.6:35b",
              response: "",
              thinking: "Raciocinio interno",
              done: false,
            })}\n`,
            `${JSON.stringify({
              model: "qwen3.6:35b",
              response: "Documento final.",
              done: true,
            })}\n`,
          ]),
          {
            status: 200,
            headers: { "content-type": "application/x-ndjson" },
          },
        ),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });
  const chunks: string[] = [];
  const planningChunks: string[] = [];

  const result = await provider.generateText({
    ...generationInput,
    onChunk: (chunk) => {
      chunks.push(chunk.textDelta);
    },
    onPlanningChunk: (chunk) => {
      planningChunks.push(chunk.planningDelta);
    },
  });

  assert.deepEqual(chunks, ["Documento final."]);
  assert.deepEqual(planningChunks, ["Raciocinio interno"]);
  assert.equal(result.text, "Documento final.");
});

test("OllamaTextGenerationProvider does not abort active streams after configured timeout", async () => {
  vi.useFakeTimers();

  const encoder = new TextEncoder();
  let releaseFinalChunk!: () => void;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `${JSON.stringify({
            model: "qwen3.6:35b",
            response: "Documento longo ",
            done: false,
          })}\n`,
        ),
      );

      await new Promise<void>((resolve) => {
        releaseFinalChunk = resolve;
      });

      controller.enqueue(
        encoder.encode(
          `${JSON.stringify({
            model: "qwen3.6:35b",
            response: "concluido.",
            done: true,
          })}\n`,
        ),
      );
      controller.close();
    },
  });

  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(stream, {
          status: 200,
          headers: { "content-type": "application/x-ndjson" },
        }),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
    timeoutMs: 300_000,
  });

  const resultPromise = provider.generateText(generationInput);

  await vi.advanceTimersByTimeAsync(301_000);
  releaseFinalChunk();

  const result = await resultPromise;

  assert.equal(result.text, "Documento longo concluido.");
});

test("OllamaTextGenerationProvider normalizes timeout failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    }),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "timeout",
    providerKey: "ollama",
    model: "qwen3.6:35b",
  });
});

test("OllamaTextGenerationProvider normalizes unavailable service (connection failure)", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("fetch failed");
    }),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "provider_unavailable",
    providerKey: "ollama",
    model: "qwen3.6:35b",
  });
});

test("OllamaTextGenerationProvider normalizes rejected model request (4xx)", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: "model 'qwen3.6:35b' not found, try pulling it first" }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        ),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "invalid_request",
    providerKey: "ollama",
    model: "qwen3.6:35b",
  });
});

test("OllamaTextGenerationProvider normalizes server error (5xx)", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "internal server error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "provider_unavailable",
    providerKey: "ollama",
    model: "qwen3.6:35b",
  });
});

test("OllamaTextGenerationProvider normalizes stream error chunks", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          createOllamaStream([
            `${JSON.stringify({
              model: "qwen3.6:35b",
              error: "model failed during generation",
              done: true,
            })}\n`,
          ]),
          {
            status: 200,
            headers: { "content-type": "application/x-ndjson" },
          },
        ),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "provider_unavailable",
    providerKey: "ollama",
    model: "qwen3.6:35b",
  });
});

test("OllamaTextGenerationProvider normalizes missing streaming body", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(null, {
          status: 200,
        }),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "provider_unavailable",
    providerKey: "ollama",
    model: "qwen3.6:35b",
  });
});

test("OllamaTextGenerationProvider normalizes empty response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          createOllamaStream([
            `${JSON.stringify({ model: "qwen3.6:35b", response: "   ", done: true })}\n`,
          ]),
          {
            status: 200,
            headers: { "content-type": "application/x-ndjson" },
          },
        ),
    ),
  );

  const provider = new OllamaTextGenerationProvider({
    model: "qwen3.6:35b",
    baseUrl: "http://127.0.0.1:11434",
  });

  await assert.rejects(async () => provider.generateText(generationInput), {
    code: "provider_unavailable",
    providerKey: "ollama",
    model: "qwen3.6:35b",
  });
});
