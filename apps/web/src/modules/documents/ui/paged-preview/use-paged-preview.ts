import { type PagedPreviewFlow, Previewer } from "pagedjs";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

type PagedPreviewStatus = "idle" | "rendering" | "ready" | "error";

export type PagedPreviewState = {
  error: Error | null;
  pageCount: number;
  performanceMs: number | null;
  status: PagedPreviewStatus;
};

type PagedPreviewStylesheet = string | Record<string, string>;

type UsePagedPreviewOptions = {
  debounceMs?: number;
  enabled?: boolean;
  outputRef: RefObject<HTMLElement | null>;
  renderKey: string;
  sourceRef: RefObject<HTMLElement | null>;
  stylesheets?: PagedPreviewStylesheet[];
};

function clearElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  element.replaceChildren();
}

function getFlowPageCount(flow: PagedPreviewFlow, output: HTMLElement) {
  return flow.pages?.length ?? output.querySelectorAll(".pagedjs_page").length;
}

export function usePagedPreview({
  debounceMs = 40,
  enabled = true,
  outputRef,
  renderKey,
  sourceRef,
  stylesheets = [],
}: UsePagedPreviewOptions) {
  const previewerRef = useRef<Previewer | null>(null);
  const renderVersionRef = useRef(0);
  const [manualRenderVersion, setManualRenderVersion] = useState(0);
  const [state, setState] = useState<PagedPreviewState>({
    error: null,
    pageCount: 0,
    performanceMs: null,
    status: "idle",
  });

  const rerender = useCallback(() => {
    setManualRenderVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    const source = sourceRef.current;
    const output = outputRef.current;
    const currentRenderKey = `${renderKey}:${manualRenderVersion}`;

    if (!enabled || !source || !output) {
      setState((current) => ({ ...current, status: "idle" }));
      return undefined;
    }

    let cancelled = false;
    const renderVersion = renderVersionRef.current + 1;
    renderVersionRef.current = renderVersion;

    previewerRef.current?.polisher?.destroy?.();
    previewerRef.current = null;
    output.dataset.pagedPreviewRenderKey = currentRenderKey;
    clearElement(output);
    setState({ error: null, pageCount: 0, performanceMs: null, status: "rendering" });

    const timeoutId = window.setTimeout(() => {
      const previewer = new Previewer();
      previewerRef.current = previewer;

      const pageContent = source.querySelector(".page-content");
      const content = (pageContent ?? source).cloneNode(true);

      void previewer
        .preview(content, stylesheets, output)
        .then((flow) => {
          if (cancelled || renderVersion !== renderVersionRef.current) {
            previewer.polisher?.destroy?.();
            return;
          }

          setState({
            error: null,
            pageCount: getFlowPageCount(flow, output),
            performanceMs: typeof flow.performance === "number" ? flow.performance : null,
            status: "ready",
          });
        })
        .catch((error: unknown) => {
          if (cancelled || renderVersion !== renderVersionRef.current) {
            return;
          }

          setState({
            error: error instanceof Error ? error : new Error("Falha ao paginar o documento."),
            pageCount: 0,
            performanceMs: null,
            status: "error",
          });
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      previewerRef.current?.polisher?.destroy?.();
      previewerRef.current = null;
      clearElement(output);
    };
  }, [debounceMs, enabled, manualRenderVersion, outputRef, renderKey, sourceRef, stylesheets]);

  return {
    ...state,
    rerender,
  };
}
