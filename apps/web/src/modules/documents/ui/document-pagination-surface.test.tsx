import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { DocumentPaginationPlan } from "../model/document-pagination";
import {
  createPaginationBoundaryCss,
  getSignatureClosingKeepWithNextIndexes,
} from "./document-pagination-surface";

function createPlan(boundaries: DocumentPaginationPlan["boundaries"]): DocumentPaginationPlan {
  return {
    boundaries,
    pageCount: 3,
    pages: [],
    totalHeight: 3000,
    usablePageHeight: 800,
  };
}

describe("createPaginationBoundaryCss", () => {
  it("scopes automatic spacer margins to screen without forcing print page breaks", () => {
    const css = createPaginationBoundaryCss(
      "surface-1",
      createPlan([
        {
          blockKey: "1",
          marginTop: 20,
          pageIndex: 1,
          placement: "before",
          reason: "automatic",
          spacerHeight: 520,
        },
      ]),
    );

    expect(css).toContain("@media screen");
    expect(css).toContain("@media print");
    expect(css).toContain(
      '[data-document-pagination-surface-id="surface-1"] [data-document-pagination-content="true"] > :nth-child(2)',
    );
    expect(css).toMatch(/@media screen \{[\s\S]*margin-top: 540px !important;/);
    expect(css).toMatch(/@media screen \{[\s\S]*break-before: page;/);
    expect(css).toMatch(/@media screen \{[\s\S]*page-break-before: always;/);
    expect(css).toMatch(
      /@media print \{[\s\S]*--document-pagination-break-before-space: 0px !important;/,
    );
    expect(css).toMatch(/@media print \{[\s\S]*margin-top: 0 !important;/);
    expect(css).toMatch(/@media print \{[\s\S]*break-before: auto;/);
    expect(css).toMatch(/@media print \{[\s\S]*page-break-before: auto;/);
    expect(css).not.toMatch(/@media print \{[\s\S]*break-before: page;/);
    expect(css).not.toMatch(/@media print \{[\s\S]*page-break-before: always;/);
  });

  it("scopes manual spacer heights to screen and keeps print page-break hints", () => {
    const css = createPaginationBoundaryCss(
      "surface-2",
      createPlan([
        {
          blockKey: "2",
          pageIndex: 1,
          placement: "self",
          reason: "manual",
          spacerHeight: 760,
        },
      ]),
    );

    expect(css).toContain("@media screen");
    expect(css).toContain("@media print");
    expect(css).toContain(
      '[data-document-pagination-surface-id="surface-2"] [data-document-pagination-content="true"] > :nth-child(3)',
    );
    expect(css).toMatch(/@media screen \{[\s\S]*height: 760px !important;/);
    expect(css).toMatch(
      /@media print \{[\s\S]*--document-pagination-manual-break-space: 0px !important;/,
    );
    expect(css).toMatch(/@media print \{[\s\S]*height: 0 !important;/);
    expect(css).toMatch(/@media print \{[\s\S]*margin: 0 !important;/);
    expect(css).toMatch(/@media print \{[\s\S]*break-after: page;/);
    expect(css).toMatch(/@media print \{[\s\S]*page-break-after: always;/);
  });
});

describe("document preview print pagination CSS", () => {
  it("resets automatic boundary spacing without re-forcing page breaks globally", () => {
    const css = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");
    const printBoundaryRuleStart = css.indexOf(
      '[data-document-preview-print-root]\n    .document-pagination-surface\n    .public-document-demo-prosemirror\n    > [data-document-pagination-break-before="true"]',
    );
    const nextRuleStart = css.indexOf(
      '[data-document-preview-print-root] [data-document-pagination-break-before="true"]',
      printBoundaryRuleStart,
    );
    const scopedPrintRule = css.slice(printBoundaryRuleStart, nextRuleStart);
    const fallbackRuleEnd = css.indexOf(
      '[data-document-preview-print-root] [data-document-pagination-manual-break="true"]',
      nextRuleStart,
    );
    const fallbackPrintRule = css.slice(nextRuleStart, fallbackRuleEnd);

    expect(printBoundaryRuleStart).toBeGreaterThanOrEqual(0);
    expect(nextRuleStart).toBeGreaterThan(printBoundaryRuleStart);
    expect(fallbackRuleEnd).toBeGreaterThan(nextRuleStart);
    expect(scopedPrintRule).toContain("--document-pagination-break-before-space: 0px !important");
    expect(scopedPrintRule).toContain("margin-top: 0 !important");
    expect(scopedPrintRule).toContain("break-before: auto !important");
    expect(scopedPrintRule).toContain("page-break-before: auto !important");
    expect(fallbackPrintRule).toContain("break-before: auto !important");
    expect(fallbackPrintRule).toContain("page-break-before: auto !important");
    expect(scopedPrintRule).not.toContain("break-before: page");
    expect(scopedPrintRule).not.toContain("page-break-before: always");
  });
});

describe("getSignatureClosingKeepWithNextIndexes", () => {
  it("keeps signature closing date and responsible name with their following blocks", () => {
    const createParagraph = (text: string, signatureClosingPart?: "date" | "name" | "role") => {
      const paragraph = document.createElement("p");

      paragraph.textContent = text;

      if (signatureClosingPart) {
        paragraph.setAttribute("data-no-first-line-indent", "true");
        paragraph.setAttribute("data-signature-closing-part", signatureClosingPart);
      }

      return paragraph;
    };
    const elements = [
      createParagraph("Conteudo anterior."),
      createParagraph("Pureza/RN, 08 de janeiro de 2026.", "date"),
      createParagraph("Maria Costa", "name"),
      createParagraph("Secretaria Municipal", "role"),
    ];

    expect([...getSignatureClosingKeepWithNextIndexes(elements)]).toEqual([1, 2]);
  });
});
