import { describe, expect, it } from "vitest";
import { planDocumentPagination } from "./document-pagination";

const geometry = {
  pageGap: 20,
  pageHeight: 1000,
  pagePaddingBottom: 100,
  pagePaddingTop: 100,
};

describe("planDocumentPagination", () => {
  it("keeps short content on one page", () => {
    const plan = planDocumentPagination(
      [
        { height: 200, key: "a" },
        { height: 250, key: "b" },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(1);
    expect(plan.boundaries).toEqual([]);
    expect(plan.totalHeight).toBe(1000);
  });

  it("adds an automatic boundary before the first overflowing block", () => {
    const plan = planDocumentPagination(
      [
        { height: 500, key: "a" },
        { height: 320, key: "b" },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(2);
    expect(plan.boundaries).toEqual([
      {
        blockKey: "b",
        pageIndex: 1,
        placement: "before",
        reason: "automatic",
        spacerHeight: 320,
      },
    ]);
  });

  it("uses manual page breaks as forced boundaries", () => {
    const plan = planDocumentPagination(
      [
        { height: 260, key: "a" },
        { height: 0, isForcedPageBreak: true, key: "break" },
        { height: 260, key: "b" },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(2);
    expect(plan.boundaries).toEqual([
      {
        blockKey: "break",
        pageIndex: 1,
        placement: "self",
        reason: "manual",
        spacerHeight: 560,
      },
    ]);
  });

  it("handles oversized blocks without creating infinite boundaries", () => {
    const plan = planDocumentPagination(
      [
        { height: 1200, key: "oversized" },
        { height: 100, key: "after" },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(2);
    expect(plan.boundaries).toHaveLength(1);
    expect(plan.boundaries[0]).toMatchObject({
      blockKey: "after",
      placement: "before",
      reason: "automatic",
    });
  });

  it("moves boundaries when content no longer overflows", () => {
    const overflowingPlan = planDocumentPagination(
      [
        { height: 500, key: "a" },
        { height: 320, key: "b" },
      ],
      geometry,
    );
    const compactPlan = planDocumentPagination(
      [
        { height: 360, key: "a" },
        { height: 320, key: "b" },
      ],
      geometry,
    );

    expect(overflowingPlan.pageCount).toBe(2);
    expect(compactPlan.pageCount).toBe(1);
    expect(compactPlan.boundaries).toEqual([]);
  });

  it("uses measured block positions to move overflowing content to the next page start", () => {
    const plan = planDocumentPagination(
      [
        { bottom: 500, height: 500, key: "a", top: 0 },
        { bottom: 820, height: 320, key: "b", top: 500 },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(2);
    expect(plan.boundaries).toEqual([
      {
        blockKey: "b",
        pageIndex: 1,
        placement: "before",
        reason: "automatic",
        spacerHeight: 520,
      },
    ]);
  });

  it("keeps measured headings with the following overflowing block", () => {
    const plan = planDocumentPagination(
      [
        { bottom: 740, height: 740, key: "intro", top: 0 },
        { bottom: 790, height: 30, keepWithNext: true, key: "heading", top: 760 },
        { bottom: 930, height: 120, key: "paragraph", top: 810 },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(2);
    expect(plan.boundaries).toEqual([
      {
        blockKey: "heading",
        pageIndex: 1,
        placement: "before",
        reason: "automatic",
        spacerHeight: 260,
      },
    ]);
  });

  it("moves a real editor heading away from the page gap with its first paragraph", () => {
    const plan = planDocumentPagination(
      [
        { bottom: 997.25, height: 243, key: "object-paragraph", top: 754.25 },
        {
          bottom: 1052.078125,
          height: 24.828125,
          keepWithNext: true,
          key: "justification-heading",
          top: 1027.25,
        },
        {
          bottom: 1336.078125,
          height: 270,
          key: "justification-paragraph",
          top: 1066.078125,
        },
      ],
      {
        pageGap: 28,
        pageHeight: 1245,
        pagePaddingBottom: 115.2,
        pagePaddingTop: 102.4,
      },
    );

    expect(plan.pageCount).toBe(2);
    expect(plan.boundaries).toEqual([
      {
        blockKey: "justification-heading",
        pageIndex: 1,
        placement: "before",
        reason: "automatic",
        spacerHeight: 245.75,
      },
    ]);
  });

  it("keeps page count aligned with measured displacement boundaries", () => {
    const plan = planDocumentPagination(
      [
        { bottom: 360, height: 360, key: "a", top: 0 },
        { bottom: 680, height: 320, key: "b", top: 360 },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(1);
    expect(plan.boundaries).toEqual([]);
    expect(plan.pages).toHaveLength(1);
  });

  it("uses measured manual breaks as forced jumps to the next page start", () => {
    const plan = planDocumentPagination(
      [
        { bottom: 260, height: 260, key: "a", top: 0 },
        { bottom: 260, height: 0, isForcedPageBreak: true, key: "break", top: 260 },
        { bottom: 520, height: 260, key: "b", top: 260 },
      ],
      geometry,
    );

    expect(plan.pageCount).toBe(2);
    expect(plan.boundaries).toEqual([
      {
        blockKey: "break",
        pageIndex: 1,
        placement: "self",
        reason: "manual",
        spacerHeight: 760,
      },
    ]);
  });
});
