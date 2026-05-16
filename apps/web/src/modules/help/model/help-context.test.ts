import { describe, expect, it } from "vitest";
import { getContextualHelpContext } from "./help-context";
import { getLocalHelpResponse, getQuickActionResponse } from "./help-responses";
import {
  createSupportHistoryEntry,
  createSupportProtocol,
  getDeterministicSupportReply,
  getSupportContextLabels,
  getSupportStatusLabel,
  SEEDED_SUPPORT_HISTORY,
  SUPPORT_ESTIMATED_RESPONSE,
  updateSupportHistoryEntry,
} from "./help-support";

describe("contextual help model", () => {
  it("maps process routes to process-specific suggestions", () => {
    expect(getContextualHelpContext("/app/processos").key).toBe("processes");
    expect(getContextualHelpContext("/app/processo/novo").key).toBe("process-create");
    expect(getContextualHelpContext("/app/processo/process-1").key).toBe("process-detail");
    expect(getContextualHelpContext("/app/processo/process-1/editar").key).toBe("process-edit");
  });

  it("maps document routes to document-specific suggestions", () => {
    expect(getContextualHelpContext("/app/documentos").key).toBe("documents");
    expect(getContextualHelpContext("/app/documento/novo").key).toBe("document-create");
    expect(getContextualHelpContext("/app/documento/document-1/preview").key).toBe(
      "document-preview",
    );
  });

  it("falls back to general guidance when there is no specific route mapping", () => {
    const context = getContextualHelpContext("/app/configuracoes");

    expect(context.key).toBe("general");
    expect(context.suggestions).toContain("Como encontro processos em andamento?");
  });

  it("returns deterministic responses for messages and quick actions", () => {
    const context = getContextualHelpContext("/app/processo/novo");

    expect(getQuickActionResponse("import-pdf")).toContain("importar um PDF");
    expect(getLocalHelpResponse("preciso importar um pdf", context)).toContain("importar um PDF");
    expect(getLocalHelpResponse("como convido um membro?", context)).toContain(
      "convidar um membro",
    );
    expect(getLocalHelpResponse("dúvida ampla", context)).toContain(context.suggestions[0]);
  });

  it("builds local support context and deterministic support replies", () => {
    const context = getContextualHelpContext("/app/documentos");

    expect(SUPPORT_ESTIMATED_RESPONSE).toBe("Tempo estimado: até 8 min");
    expect(createSupportProtocol(context.key)).toMatch(/^LD-DOCUMENTS-/);
    expect(getSupportContextLabels(context, "/app/documentos")).toEqual([
      { label: "Tela", value: "documentos" },
      { label: "Fluxo", value: context.subtitle },
      { label: "Rota", value: "/app/documentos" },
    ]);
    expect(getDeterministicSupportReply("deu erro ao gerar documento")).toContain("erro");
    expect(getDeterministicSupportReply("o pdf não importou")).toContain("PDF");
  });

  it("builds and updates local support history records", () => {
    const messages = [
      {
        id: "message-1",
        role: "user" as const,
        content: "Preciso revisar uma mensagem anterior",
        time: "09:20",
        status: "read" as const,
      },
    ];
    const entry = createSupportHistoryEntry({
      protocol: "LD-HOME-0548",
      issue: "Preciso revisar uma mensagem anterior",
      messages,
      hasScreenshot: true,
    });

    expect(SEEDED_SUPPORT_HISTORY.length).toBeGreaterThan(0);
    expect(getSupportStatusLabel("resolved")).toBe("Resolvido");
    expect(entry).toMatchObject({
      protocol: "LD-HOME-0548",
      title: "Preciso revisar uma mensagem anterior",
      latestPreview: "Preciso revisar uma mensagem anterior",
      status: "active",
      hasScreenshot: true,
    });

    const updated = updateSupportHistoryEntry(
      [entry],
      entry.id,
      [
        ...messages,
        {
          id: "message-2",
          role: "support" as const,
          content: "Mensagem localizada.",
          time: "09:21",
        },
      ],
      "Mensagem localizada.",
    );

    expect(updated[0].latestPreview).toBe("Mensagem localizada.");
    expect(updated[0].messages).toHaveLength(2);
  });
});
