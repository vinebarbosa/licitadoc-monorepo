import { describe, expect, it } from "vitest";
import {
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
