import { describe, expect, it } from "vitest";
import {
  getDefaultDocumentsFilters,
  getDocumentsFilterSearchParams,
  getDocumentPreviewSource,
  getPreviewableDraftContentJson,
  isTiptapDocumentJson,
} from "./documents";

const jsonContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Texto salvo em JSON." }],
    },
  ],
};

describe("document preview source selection", () => {
  it("prefers editor JSON over compatibility text content", () => {
    const source = getDocumentPreviewSource({
      draftContent: "Texto antigo de compatibilidade.",
      draftContentJson: jsonContent,
    });

    expect(source).toEqual({
      kind: "json",
      content: jsonContent,
      textContent: "Texto antigo de compatibilidade.",
    });
  });

  it("falls back to text content when JSON is unavailable", () => {
    const source = getDocumentPreviewSource({
      draftContent: "  Texto legado.  ",
      draftContentJson: null,
    });

    expect(source).toEqual({
      kind: "text",
      content: "Texto legado.",
      textContent: "Texto legado.",
    });
  });

  it("ignores invalid or empty preview content", () => {
    expect(isTiptapDocumentJson({ type: "paragraph" })).toBe(false);
    expect(getPreviewableDraftContentJson({ type: "paragraph" })).toBeNull();
    expect(
      getDocumentPreviewSource({
        draftContent: "   ",
        draftContentJson: { type: "paragraph" },
      }),
    ).toBeNull();
  });
});

describe("document listing filter URL helpers", () => {
  it("restores supported filters from URL params", () => {
    const filters = getDefaultDocumentsFilters(
      new URLSearchParams("tipo=tr&status=em_edicao&search=termo"),
    );

    expect(filters).toEqual({
      search: "termo",
      typeFilter: "tr",
      statusFilter: "em_edicao",
    });
  });

  it("normalizes invalid filter params to defaults", () => {
    const filters = getDefaultDocumentsFilters(
      new URLSearchParams("tipo=invalido&status=pendente&search=%20%20"),
    );

    expect(filters).toEqual({
      search: "",
      typeFilter: "todos",
      statusFilter: "todos",
    });
  });

  it("serializes only non-default filters", () => {
    const searchParams = getDocumentsFilterSearchParams({
      search: "  termo  ",
      typeFilter: "etp",
      statusFilter: "concluido",
    });

    expect(searchParams.toString()).toBe("search=termo&tipo=etp&status=concluido");
  });

  it("omits default filters from the query string", () => {
    const searchParams = getDocumentsFilterSearchParams({
      search: "  ",
      typeFilter: "todos",
      statusFilter: "todos",
    });

    expect(searchParams.toString()).toBe("");
  });
});
