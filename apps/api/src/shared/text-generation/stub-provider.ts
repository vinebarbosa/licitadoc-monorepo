import { validGeneratedTiptapFixturesByType } from "../generated-tiptap-json-output.fixtures";
import type { TextGenerationInput, TextGenerationProvider, TextGenerationResult } from "./types";

export class StubTextGenerationProvider implements TextGenerationProvider {
  readonly model: string;
  readonly providerKey = "stub";
  readonly supportsStructuredOutput = true;
  readonly supportsTiptapJsonOutput = true;

  constructor(model: string) {
    this.model = model;
  }

  async generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
    if (input.structuredOutput) {
      const text =
        input.structuredOutput.outputFormat === "tiptap_json"
          ? JSON.stringify(validGeneratedTiptapFixturesByType[input.documentType], null, 2)
          : JSON.stringify(
              {
                documentType: input.documentType,
                organizationId: input.subject.organizationId,
                processId: input.subject.processId,
                metadata: {
                  provider: "stub",
                },
              },
              null,
              2,
            );

      await input.onChunk?.({
        textDelta: text,
        metadata: {
          finishReason: "stop",
          structuredOutputRequested: true,
        },
      });

      return {
        providerKey: this.providerKey,
        model: this.model,
        text,
        responseMetadata: {
          finishReason: "stop",
          outputFormat: input.structuredOutput.outputFormat ?? "json_schema",
          structuredOutputRequested: true,
        },
      };
    }

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
