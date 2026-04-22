import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";
import { OpenAiTextGenerationProvider } from "./openai-provider";
import { resolveTextGenerationProvider } from "./resolve-provider";
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
});

test("resolveTextGenerationProvider selects supported providers", () => {
  const stubProvider = resolveTextGenerationProvider({
    providerKey: "stub",
    model: "stub-model",
  });
  const openAiProvider = resolveTextGenerationProvider({
    providerKey: "openai",
    model: "gpt-test",
    apiKey: "test-key",
  });

  assert.equal(stubProvider.providerKey, "stub");
  assert.equal(stubProvider.model, "stub-model");
  assert.equal(openAiProvider.providerKey, "openai");
  assert.equal(openAiProvider.model, "gpt-test");
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
