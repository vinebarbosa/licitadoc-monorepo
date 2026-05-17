export const DOCUMENT_PAGINATION_DEFAULTS = {
  pageHeight: 1245,
  pageGap: 28,
  pagePaddingBottom: 128,
  pagePaddingTop: 112,
};

const MIN_USABLE_PAGE_HEIGHT = 240;

export type DocumentPaginationBlockMetric = {
  bottom?: number;
  height: number;
  isForcedPageBreak?: boolean;
  keepWithNext?: boolean;
  key: string;
  marginTop?: number;
  top?: number;
};

export type DocumentPaginationBoundary = {
  blockKey: string;
  marginTop?: number;
  pageIndex: number;
  placement: "before" | "self";
  reason: "automatic" | "manual";
  spacerHeight: number;
};

export type DocumentPaginationPage = {
  height: number;
  index: number;
  top: number;
};

export type DocumentPaginationPlan = {
  boundaries: DocumentPaginationBoundary[];
  pageCount: number;
  pages: DocumentPaginationPage[];
  totalHeight: number;
  usablePageHeight: number;
};

export type DocumentPaginationGeometry = {
  pageGap?: number;
  pageHeight?: number;
  pagePaddingBottom?: number;
  pagePaddingTop?: number;
};

function positiveNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getDocumentPaginationGeometry(geometry: DocumentPaginationGeometry = {}) {
  const pageHeight = positiveNumber(geometry.pageHeight, DOCUMENT_PAGINATION_DEFAULTS.pageHeight);
  const pageGap = Math.max(0, geometry.pageGap ?? DOCUMENT_PAGINATION_DEFAULTS.pageGap);
  const pagePaddingTop = Math.max(
    0,
    geometry.pagePaddingTop ?? DOCUMENT_PAGINATION_DEFAULTS.pagePaddingTop,
  );
  const pagePaddingBottom = Math.max(
    0,
    geometry.pagePaddingBottom ?? DOCUMENT_PAGINATION_DEFAULTS.pagePaddingBottom,
  );
  const usablePageHeight = Math.max(
    MIN_USABLE_PAGE_HEIGHT,
    pageHeight - pagePaddingTop - pagePaddingBottom,
  );

  return {
    pageGap,
    pageHeight,
    pagePaddingBottom,
    pagePaddingTop,
    usablePageHeight,
  };
}

function createPages(pageCount: number, pageHeight: number, pageGap: number) {
  return Array.from({ length: Math.max(1, pageCount) }, (_, index) => ({
    height: pageHeight,
    index,
    top: index * (pageHeight + pageGap),
  }));
}

export function getDocumentPaginationTotalHeight(
  pageCount: number,
  pageHeight: number,
  pageGap: number,
) {
  const safePageCount = Math.max(1, pageCount);

  return safePageCount * pageHeight + Math.max(0, safePageCount - 1) * pageGap;
}

function hasMeasuredPosition(block: DocumentPaginationBlockMetric) {
  return (
    typeof block.top === "number" &&
    Number.isFinite(block.top) &&
    typeof block.bottom === "number" &&
    Number.isFinite(block.bottom)
  );
}

function planMeasuredDocumentPagination(
  blocks: DocumentPaginationBlockMetric[],
  geometry: ReturnType<typeof getDocumentPaginationGeometry>,
): DocumentPaginationPlan {
  const { pageGap, pageHeight, usablePageHeight } = geometry;
  const boundaries: DocumentPaginationBoundary[] = [];
  const pageStride = pageHeight + pageGap;
  let pageIndex = 0;
  let displacement = 0;
  let maxPageIndex = 0;

  for (const [index, block] of blocks.entries()) {
    const naturalTop = Math.max(0, block.top ?? 0);
    const naturalBottom = Math.max(naturalTop, block.bottom ?? naturalTop);
    const blockTop = naturalTop + displacement;
    const blockBottom = naturalBottom + displacement;
    const blockHeight = Math.max(0, block.height, blockBottom - blockTop);
    const nextBlock = blocks[index + 1];
    const nextBlockBottom =
      block.keepWithNext &&
      nextBlock &&
      !nextBlock.isForcedPageBreak &&
      hasMeasuredPosition(nextBlock)
        ? Math.max(naturalBottom, Math.max(nextBlock.top ?? 0, nextBlock.bottom ?? 0)) +
          displacement
        : blockBottom;

    const pageStart = pageIndex * pageStride;
    const usablePageBottom = pageStart + usablePageHeight;

    if (block.isForcedPageBreak) {
      const nextPageIndex = pageIndex + 1;
      const nextPageStart = nextPageIndex * pageStride;
      const spacerHeight = Math.max(0, nextPageStart - blockTop);

      boundaries.push({
        blockKey: block.key,
        pageIndex: nextPageIndex,
        placement: "self",
        reason: "manual",
        spacerHeight,
      });

      displacement += spacerHeight;
      pageIndex = nextPageIndex;
      maxPageIndex = Math.max(maxPageIndex, pageIndex);
      continue;
    }

    let adjustedBottom = blockBottom;
    const startsAfterPageStart = blockTop > pageStart;

    if (startsAfterPageStart && Math.max(blockBottom, nextBlockBottom) > usablePageBottom) {
      const nextPageIndex = pageIndex + 1;
      const nextPageStart = nextPageIndex * pageStride;
      const spacerHeight = Math.max(0, nextPageStart - blockTop);

      boundaries.push({
        blockKey: block.key,
        ...(block.marginTop === undefined ? {} : { marginTop: block.marginTop }),
        pageIndex: nextPageIndex,
        placement: "before",
        reason: "automatic",
        spacerHeight,
      });

      displacement += spacerHeight;
      adjustedBottom += spacerHeight;
      pageIndex = nextPageIndex;
    }

    if (blockHeight > usablePageHeight) {
      const blockEndPageIndex = Math.max(
        pageIndex,
        Math.floor(Math.max(0, adjustedBottom - 1) / pageStride),
      );

      pageIndex = blockEndPageIndex;
      maxPageIndex = Math.max(maxPageIndex, blockEndPageIndex);
      continue;
    }

    maxPageIndex = Math.max(maxPageIndex, pageIndex);
  }

  const boundaryPageCount = boundaries.reduce(
    (pageCount, boundary) => Math.max(pageCount, boundary.pageIndex + 1),
    1,
  );
  const pageCount = Math.max(boundaryPageCount, maxPageIndex + 1);
  const pages = createPages(pageCount, pageHeight, pageGap);

  return {
    boundaries,
    pageCount,
    pages,
    totalHeight: getDocumentPaginationTotalHeight(pageCount, pageHeight, pageGap),
    usablePageHeight,
  };
}

function planEstimatedDocumentPagination(
  blocks: DocumentPaginationBlockMetric[],
  geometry: ReturnType<typeof getDocumentPaginationGeometry>,
): DocumentPaginationPlan {
  const { pageHeight, pageGap, usablePageHeight } = geometry;
  const boundaries: DocumentPaginationBoundary[] = [];
  let pageIndex = 0;
  let usedHeight = 0;

  for (const block of blocks) {
    const blockHeight = Math.max(0, block.height);

    if (block.isForcedPageBreak) {
      const spacerHeight = Math.max(0, usablePageHeight - usedHeight) + pageGap;

      boundaries.push({
        blockKey: block.key,
        pageIndex: pageIndex + 1,
        placement: "self",
        reason: "manual",
        spacerHeight,
      });

      pageIndex += 1;
      usedHeight = 0;
      continue;
    }

    if (usedHeight > 0 && usedHeight + blockHeight > usablePageHeight) {
      const spacerHeight = Math.max(0, usablePageHeight - usedHeight) + pageGap;

      boundaries.push({
        blockKey: block.key,
        pageIndex: pageIndex + 1,
        placement: "before",
        reason: "automatic",
        spacerHeight,
      });

      pageIndex += 1;
      usedHeight = blockHeight > usablePageHeight ? usablePageHeight : blockHeight;
      continue;
    }

    if (blockHeight > usablePageHeight) {
      usedHeight = usablePageHeight;
      continue;
    }

    usedHeight += blockHeight;
  }

  const pageCount = Math.max(1, pageIndex + 1);
  const pages = createPages(pageCount, pageHeight, pageGap);

  return {
    boundaries,
    pageCount,
    pages,
    totalHeight: getDocumentPaginationTotalHeight(pageCount, pageHeight, pageGap),
    usablePageHeight,
  };
}

export function planDocumentPagination(
  blocks: DocumentPaginationBlockMetric[],
  geometry: DocumentPaginationGeometry = {},
): DocumentPaginationPlan {
  const paginationGeometry = getDocumentPaginationGeometry(geometry);

  if (blocks.some(hasMeasuredPosition)) {
    return planMeasuredDocumentPagination(blocks, paginationGeometry);
  }

  return planEstimatedDocumentPagination(blocks, paginationGeometry);
}

export function createDocumentPaginationLayout(
  pageCount: number,
  geometry: DocumentPaginationGeometry = {},
) {
  const { pageGap, pageHeight, usablePageHeight } = getDocumentPaginationGeometry(geometry);
  const safePageCount = Math.max(1, pageCount);

  return {
    boundaries: [],
    pageCount: safePageCount,
    pages: createPages(safePageCount, pageHeight, pageGap),
    totalHeight: getDocumentPaginationTotalHeight(safePageCount, pageHeight, pageGap),
    usablePageHeight,
  } satisfies DocumentPaginationPlan;
}
