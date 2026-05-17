import type { Editor } from "@tiptap/react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createDocumentPaginationLayout,
  type DocumentPaginationBlockMetric,
  type DocumentPaginationGeometry,
  type DocumentPaginationPlan,
  getDocumentPaginationGeometry,
  planDocumentPagination,
} from "../model/document-pagination";

type DocumentPaginationSurfaceProps = {
  children: ReactNode;
  className?: string;
  editor: Editor | null;
  enabled?: boolean;
  geometry?: DocumentPaginationGeometry;
};

const DEFAULT_LAYOUT = createDocumentPaginationLayout(1);
let paginationSurfaceIdCounter = 0;

function readPixelCustomProperty(element: HTMLElement, propertyName: string, fallback: number) {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim();
  const numericValue = Number.parseFloat(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function clearPaginationElementState(element: HTMLElement) {
  element.removeAttribute("data-document-pagination-block");
  element.removeAttribute("data-document-pagination-break-before");
  element.removeAttribute("data-document-pagination-base-margin-top");
  element.removeAttribute("data-document-pagination-manual-break");
  element.removeAttribute("data-document-pagination-page-start");
  element.style.removeProperty("--document-pagination-break-before-space");
  element.style.removeProperty("--document-pagination-manual-break-space");
}

function getPaginationContentBlocks(editorElement: HTMLElement) {
  if (typeof HTMLElement === "undefined") {
    return [];
  }

  return Array.from(editorElement.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.getAttribute("data-document-pagination-ignore") !== "true",
  );
}

function getPaginationElementsByKey(editorElement: HTMLElement) {
  const elementsByKey = new Map<string, HTMLElement>();
  const elements = getPaginationContentBlocks(editorElement);

  for (const element of elements) {
    clearPaginationElementState(element);
  }

  for (const [index, element] of elements.entries()) {
    const key = String(index);

    element.setAttribute("data-document-pagination-block", key);
    elementsByKey.set(key, element);
  }

  return elementsByKey;
}

function getElementScale(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const scale = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;

  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function getMeasuredBlocks(editorElement: HTMLElement, scale = 1) {
  const editorRect = editorElement.getBoundingClientRect();
  const elementsByKey = getPaginationElementsByKey(editorElement);
  const blocks: DocumentPaginationBlockMetric[] = [];
  const measurementScale = scale > 0 ? scale : 1;

  for (const [index, element] of getPaginationContentBlocks(editorElement).entries()) {
    const key = String(index);
    const rect = element.getBoundingClientRect();
    const top = Math.max(0, (rect.top - editorRect.top) / measurementScale);
    const bottom = Math.max(top, (rect.bottom - editorRect.top) / measurementScale);
    const isForcedPageBreak = element.tagName === "HR";
    const measuredHeight = isForcedPageBreak
      ? 0
      : Math.max(0, rect.height / measurementScale, bottom - top);
    const marginTop = Number.parseFloat(getComputedStyle(element).marginTop) || 0;

    element.setAttribute("data-document-pagination-block", key);
    elementsByKey.set(key, element);
    blocks.push({
      bottom,
      height: measuredHeight,
      isForcedPageBreak,
      keepWithNext: /^H[1-6]$/.test(element.tagName),
      key,
      marginTop,
      top,
    });
  }

  return { blocks, elementsByKey };
}

function applyPaginationPlanToEditor(editorElement: HTMLElement, plan: DocumentPaginationPlan) {
  applyPaginationBoundaries(plan, getPaginationElementsByKey(editorElement));
}

function createPaginationBoundaryCss(surfaceId: string, layout: DocumentPaginationPlan) {
  return layout.boundaries
    .map((boundary) => {
      const blockIndex = Number.parseInt(boundary.blockKey, 10);

      if (!Number.isInteger(blockIndex) || blockIndex < 0) {
        return "";
      }

      const childIndex = blockIndex + 1;
      const selector = `[data-document-pagination-surface-id="${surfaceId}"] [data-document-pagination-content="true"] > :nth-child(${childIndex})`;

      if (boundary.placement === "self") {
        return `${selector} {
  height: ${boundary.spacerHeight}px !important;
  margin: 0 calc(-1 * var(--public-document-demo-page-x)) !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  break-after: page;
  page-break-after: always;
}`;
      }

      return `${selector} {
  margin-top: ${boundary.spacerHeight + (boundary.marginTop ?? 0)}px !important;
  break-before: page;
  page-break-before: always;
}`;
    })
    .filter(Boolean)
    .join("\n");
}

function applyPaginationBoundaries(
  plan: DocumentPaginationPlan,
  elementsByKey: Map<string, HTMLElement>,
) {
  for (const boundary of plan.boundaries) {
    const element = elementsByKey.get(boundary.blockKey);

    if (!element) {
      continue;
    }

    element.setAttribute("data-document-pagination-page-start", String(boundary.pageIndex + 1));

    if (boundary.placement === "self") {
      element.setAttribute("data-document-pagination-manual-break", "true");
      element.style.setProperty(
        "--document-pagination-manual-break-space",
        `${boundary.spacerHeight}px`,
      );
      continue;
    }

    const storedBaseMarginTop = element.getAttribute("data-document-pagination-base-margin-top");
    const baseMarginTop =
      storedBaseMarginTop === null
        ? Number.parseFloat(getComputedStyle(element).marginTop) || 0
        : Number.parseFloat(storedBaseMarginTop) || 0;

    element.setAttribute("data-document-pagination-base-margin-top", String(baseMarginTop));
    element.setAttribute("data-document-pagination-break-before", "true");
    element.style.setProperty(
      "--document-pagination-break-before-space",
      `${baseMarginTop + boundary.spacerHeight}px`,
    );
  }
}

function arePaginationPlansEqual(current: DocumentPaginationPlan, next: DocumentPaginationPlan) {
  if (
    current.pageCount !== next.pageCount ||
    current.totalHeight !== next.totalHeight ||
    current.usablePageHeight !== next.usablePageHeight ||
    current.boundaries.length !== next.boundaries.length
  ) {
    return false;
  }

  return current.boundaries.every((boundary, index) => {
    const nextBoundary = next.boundaries[index];

    return (
      boundary.blockKey === nextBoundary.blockKey &&
      boundary.pageIndex === nextBoundary.pageIndex &&
      boundary.placement === nextBoundary.placement &&
      boundary.reason === nextBoundary.reason &&
      boundary.spacerHeight === nextBoundary.spacerHeight
    );
  });
}

export function useDocumentPagination({
  editor,
  enabled = true,
  geometry,
}: {
  editor: Editor | null;
  enabled?: boolean;
  geometry?: DocumentPaginationGeometry;
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [layout, setLayout] = useState<DocumentPaginationPlan>(() => DEFAULT_LAYOUT);

  const measure = useCallback(() => {
    const surfaceElement = surfaceRef.current;
    const editorElement = editor?.view.dom;

    if (!enabled || !surfaceElement || !editorElement) {
      return;
    }

    editorElement.setAttribute("data-document-pagination-content", "true");

    const surfaceStyle = getComputedStyle(surfaceElement);
    const pageHeight = readPixelCustomProperty(
      surfaceElement,
      "--document-pagination-page-height",
      geometry?.pageHeight ?? DEFAULT_LAYOUT.pages[0].height,
    );
    const pageGap = readPixelCustomProperty(
      surfaceElement,
      "--document-pagination-page-gap",
      geometry?.pageGap ?? 28,
    );
    const pagePaddingTop = Number.parseFloat(surfaceStyle.paddingTop) || geometry?.pagePaddingTop;
    const pagePaddingBottom =
      Number.parseFloat(surfaceStyle.paddingBottom) || geometry?.pagePaddingBottom;
    const paginationGeometry = getDocumentPaginationGeometry({
      pageGap,
      pageHeight,
      pagePaddingBottom,
      pagePaddingTop,
    });
    const { blocks, elementsByKey } = getMeasuredBlocks(
      editorElement,
      getElementScale(surfaceElement),
    );
    const measuredPlan = planDocumentPagination(blocks, paginationGeometry);

    applyPaginationBoundaries(measuredPlan, elementsByKey);

    setLayout((currentLayout) =>
      arePaginationPlansEqual(currentLayout, measuredPlan) ? currentLayout : measuredPlan,
    );

    requestAnimationFrame(() => {
      applyPaginationPlanToEditor(editorElement, measuredPlan);
    });

    window.setTimeout(() => {
      applyPaginationPlanToEditor(editorElement, measuredPlan);
    }, 40);
  }, [editor, enabled, geometry]);

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    const surfaceElement = surfaceRef.current;
    const editorElement = editor?.view.dom;

    if (!enabled || !surfaceElement || !editorElement) {
      return;
    }

    scheduleMeasure();
    const catchUpTimers = [60, 180, 420, 800].map((delay) =>
      window.setTimeout(scheduleMeasure, delay),
    );
    editor.on("update", scheduleMeasure);
    editor.on("transaction", scheduleMeasure);
    window.addEventListener("resize", scheduleMeasure);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    const mutationObserver =
      typeof MutationObserver === "undefined" ? null : new MutationObserver(scheduleMeasure);

    resizeObserver?.observe(surfaceElement);
    resizeObserver?.observe(editorElement);
    mutationObserver?.observe(editorElement, {
      childList: true,
      subtree: true,
    });
    void document.fonts?.ready.then(scheduleMeasure);

    return () => {
      editor.off("update", scheduleMeasure);
      editor.off("transaction", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      for (const timer of catchUpTimers) {
        window.clearTimeout(timer);
      }
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [editor, enabled, scheduleMeasure]);

  useLayoutEffect(() => {
    const editorElement = editor?.view.dom;

    if (!enabled || !editorElement) {
      return;
    }

    applyPaginationPlanToEditor(editorElement, layout);

    const frame = requestAnimationFrame(() => {
      applyPaginationPlanToEditor(editorElement, layout);
    });
    const timer = window.setTimeout(() => {
      applyPaginationPlanToEditor(editorElement, layout);
    }, 40);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [editor, enabled, layout]);

  return {
    layout,
    scheduleMeasure,
    surfaceRef,
  };
}

export function DocumentPaginationSurface({
  children,
  className,
  editor,
  enabled = true,
  geometry,
}: DocumentPaginationSurfaceProps) {
  const { layout, surfaceRef } = useDocumentPagination({ editor, enabled, geometry });
  const surfaceIdRef = useRef<string | null>(null);

  if (!surfaceIdRef.current) {
    paginationSurfaceIdCounter += 1;
    surfaceIdRef.current = `document-pagination-surface-${paginationSurfaceIdCounter}`;
  }

  const surfaceId = surfaceIdRef.current;
  const style = useMemo(
    () =>
      ({
        "--document-pagination-total-height": `${layout.totalHeight}px`,
      }) as CSSProperties,
    [layout.totalHeight],
  );
  const boundaryCss = useMemo(
    () => createPaginationBoundaryCss(surfaceId, layout),
    [layout, surfaceId],
  );

  return (
    <div
      ref={surfaceRef}
      className={className}
      data-document-pagination-boundary-count={layout.boundaries.length}
      data-document-pagination-surface-id={surfaceId}
      data-document-pagination-surface={enabled ? "true" : undefined}
      data-document-pagination-page-count={layout.pageCount}
      style={style}
    >
      {enabled && boundaryCss ? (
        <style
          data-document-pagination-boundary-style="true"
          data-document-pagination-ignore="true"
        >
          {boundaryCss}
        </style>
      ) : null}
      {enabled ? (
        <div
          className="document-pagination-page-frames"
          aria-hidden="true"
          data-document-pagination-ignore="true"
        >
          {layout.pages.map((page) => (
            <div
              key={page.index}
              className="document-pagination-page-frame"
              style={{ height: page.height, top: page.top }}
            />
          ))}
        </div>
      ) : null}
      <div className="document-pagination-content-layer">{children}</div>
    </div>
  );
}
