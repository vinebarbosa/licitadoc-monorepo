import { Download, RefreshCw } from "lucide-react";
import { type CSSProperties, type ReactNode, useMemo, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { pagedPreviewMediaCss } from "./paged-preview-media-css";
import "./paged-preview.css";
import { usePagedPreview } from "./use-paged-preview";

type DocumentPreviewProps = {
  children: ReactNode;
  className?: string;
  letterheadUrl?: string;
  renderKey: string;
  showToolbar?: boolean;
  title?: string;
  toolbarEyebrow?: string;
};

type PagedPreviewCssProperties = CSSProperties & {
  "--paged-preview-letterhead-image"?: string;
};

export function DocumentPreview({
  children,
  className,
  letterheadUrl,
  renderKey,
  showToolbar = true,
  title = "Preview paginado",
  toolbarEyebrow = "Laboratorio Paged.js",
}: DocumentPreviewProps) {
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const stylesheets = useMemo(() => [{ "licitadoc-paged-preview.css": pagedPreviewMediaCss }], []);
  const { error, pageCount, performanceMs, rerender, status } = usePagedPreview({
    outputRef,
    renderKey,
    sourceRef,
    stylesheets,
  });

  function handleExportPdf() {
    window.print();
  }

  const shellStyle: PagedPreviewCssProperties | undefined = letterheadUrl
    ? {
        "--paged-preview-letterhead-image": `url("${letterheadUrl}")`,
      }
    : undefined;

  return (
    <section
      className={cn(
        "paged-preview-shell",
        !showToolbar && "paged-preview-shell--embedded",
        className,
      )}
      data-document-letterhead={letterheadUrl ? "true" : undefined}
      data-document-sheet
      data-institutional-document-no-branding="true"
      data-institutional-document-output
      data-institutional-document-sheet
      data-paged-preview-letterhead={letterheadUrl ? "true" : undefined}
      data-paged-preview-print-root
      data-testid="document-preview-sheet"
      style={shellStyle}
    >
      {showToolbar ? (
        <div className="paged-preview-toolbar" data-paged-preview-actions>
          <div>
            <p className="paged-preview-eyebrow">{toolbarEyebrow}</p>
            <h1>{title}</h1>
            <p>
              {status === "ready"
                ? `${pageCount} pagina(s) geradas${
                    performanceMs ? ` em ${Math.round(performanceMs)} ms` : ""
                  }.`
                : "Preparando paginas A4 com cabecalho, rodape e PDF."}
            </p>
          </div>
          <div className="paged-preview-toolbar-actions">
            <Button type="button" variant="outline" onClick={rerender}>
              <RefreshCw className="mr-2 size-4" />
              Renderizar
            </Button>
            <Button type="button" onClick={handleExportPdf} disabled={status !== "ready"}>
              <Download className="mr-2 size-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="paged-preview-error" role="alert">
          Nao foi possivel paginar o documento: {error.message}
        </div>
      ) : null}

      <div className="paged-preview-stage">
        {status === "rendering" && showToolbar ? (
          <div className="paged-preview-rendering" role="status">
            Renderizando preview paginado...
          </div>
        ) : null}
        <div ref={outputRef} className="paged-preview-output" data-paged-preview-output />
      </div>

      <div
        id="paged-root"
        ref={sourceRef}
        className="paged-preview-source"
        data-paged-preview-source
        aria-hidden="true"
      >
        <div className="page-content">{children}</div>
      </div>
    </section>
  );
}
