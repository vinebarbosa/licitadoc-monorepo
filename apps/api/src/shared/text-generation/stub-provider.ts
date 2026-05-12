import type { TextGenerationInput, TextGenerationProvider, TextGenerationResult } from "./types";

export class StubTextGenerationProvider implements TextGenerationProvider {
  readonly model: string;
  readonly providerKey = "stub";

  constructor(model: string) {
    this.model = model;
  }

  async generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
    const text = [
      `Documento ${input.documentType.toUpperCase()}`,
      "",
      "Rascunho gerado automaticamente para avaliacao interna.",
      "",
      `Processo: ${input.subject.processId}`,
      `Organizacao: ${input.subject.organizationId}`,
      "",
      input.prompt,
    ].join("\n");

    await input.onChunk?.({
      textDelta: text,
      metadata: {
        finishReason: "stop",
      },
    });

    return {
      providerKey: this.providerKey,
      model: this.model,
      text,
      responseMetadata: {
        finishReason: "stop",
      },
    };
  }
}
