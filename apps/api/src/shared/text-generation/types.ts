export const supportedGeneratedDocumentTypes = ["dfd", "etp", "tr", "minuta"] as const;

export type GeneratedDocumentType = (typeof supportedGeneratedDocumentTypes)[number];

export type TextGenerationFailureCode =
  | "authentication_failed"
  | "invalid_request"
  | "provider_unavailable"
  | "rate_limited"
  | "timeout"
  | "unknown";

export type TextGenerationInput = {
  documentType: GeneratedDocumentType;
  prompt: string;
  subject: {
    documentId: string;
    organizationId: string;
    processId: string;
  };
};

export type TextGenerationResult = {
  model: string;
  providerKey: string;
  responseMetadata: Record<string, unknown>;
  text: string;
};

export class TextGenerationError extends Error {
  code: TextGenerationFailureCode;
  details: Record<string, unknown> | null;
  model: string | null;
  providerKey: string;

  constructor({
    code,
    details = null,
    message,
    model = null,
    providerKey,
  }: {
    code: TextGenerationFailureCode;
    details?: Record<string, unknown> | null;
    message: string;
    model?: string | null;
    providerKey: string;
  }) {
    super(message);
    this.name = "TextGenerationError";
    this.code = code;
    this.details = details;
    this.model = model;
    this.providerKey = providerKey;
  }
}

export interface TextGenerationProvider {
  readonly model: string;
  readonly providerKey: string;

  generateText(input: TextGenerationInput): Promise<TextGenerationResult>;
}
