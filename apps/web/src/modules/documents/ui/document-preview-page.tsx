import { resolveApiUrl } from "@licitadoc/api-client";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  Printer,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAppShellHeader } from "@/modules/app-shell";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { PageBackButton } from "@/shared/ui/page-back";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";
import { useDocumentDetail, useDocumentGenerationEvents } from "../api/documents";
import {
  type DocumentEditorJson,
  getDocumentPreviewBreadcrumbs,
  getDocumentPreviewSource,
  getPreviewableDraftContent,
} from "../model/documents";
import { DocumentMarkdownPreview } from "./document-markdown-preview";
import {
  exportPagedPreviewToPdf,
  getPagedPreviewPageElements,
} from "./document-preview-pdf-export";
import { getDocumentTiptapExtensions } from "./document-tiptap-extensions";
import { DocumentTiptapPreview } from "./document-tiptap-preview";
import {
  getInstitutionalDocumentOutputClassName,
  institutionalDocumentTheme,
  institutionalDocumentThemeTokens,
} from "./institutional-document-theme";
import { DocumentPreview as PagedDocumentPreview, PaperLayout } from "./paged-preview";

function resolveApiAssetUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  try {
    return resolveApiUrl(url);
  } catch {
    return null;
  }
}

function DocumentPreviewLoadingState() {
  return (
    <main className="flex-1 overflow-auto bg-muted/30">
      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-9 w-40 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>

          <Card className="shadow-lg">
            <CardContent className="space-y-8 p-8 md:p-12">
              <div className="space-y-3 text-center">
                <Skeleton className="mx-auto h-4 w-52" />
                <Skeleton className="mx-auto h-4 w-64" />
                <Skeleton className="mx-auto h-7 w-72 max-w-full" />
                <Skeleton className="mx-auto h-4 w-36" />
              </div>
              <Separator />
              <div className="space-y-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Separator />
              <div className="space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-40 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function DocumentPreviewActions({
  canExportPdf = false,
  canPrint = false,
  documentId,
  isExportingPdf = false,
  onExportPdf,
}: {
  canExportPdf?: boolean;
  canPrint?: boolean;
  documentId: string;
  isExportingPdf?: boolean;
  onExportPdf: () => void;
}) {
  const navigate = useNavigate();

  function handleBack() {
    const historyState = window.history.state as { idx?: number } | null;

    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }

    navigate("/app/documentos", { replace: true });
  }

  return (
    <div
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      data-document-preview-actions
    >
      <div className="flex items-center gap-3">
        <PageBackButton onClick={handleBack} />
      </div>

      <div className="flex gap-2">
        <Button asChild type="button" variant="outline" size="sm">
          <Link to={`/app/documento/${documentId}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrint}
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!canPrint}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar DOCX
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canExportPdf || isExportingPdf}
          onClick={onExportPdf}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExportingPdf ? "Exportando..." : "Exportar PDF"}
        </Button>
      </div>
    </div>
  );
}

function DocumentPreviewFailureState({
  title,
  description,
  canRetry,
  onRetry,
}: {
  title: string;
  description: string;
  canRetry: boolean;
  onRetry?: () => void;
}) {
  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangle className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            {canRetry ? (
              <Button type="button" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/app/documentos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Documentos
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}

function DocumentPreviewStateCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: "loading" | "alert" | "file";
}) {
  const Icon = icon === "alert" ? AlertTriangle : FileText;

  return (
    <Card>
      <CardContent className="p-8">
        <Empty className="py-6">
          <EmptyHeader>
            {icon === "loading" ? (
              <EmptyMedia className="mb-3 text-primary">
                <Spinner className="size-12" aria-label="Gerando preview" />
              </EmptyMedia>
            ) : (
              <EmptyMedia variant="icon">
                <Icon className="h-6 w-6" />
              </EmptyMedia>
            )}
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}

const planningSteps = [
  {
    label: "Recebendo contexto do processo",
    description: "Conferindo os dados iniciais disponíveis para a geração.",
  },
  {
    label: "Identificando tipo e finalidade",
    description: "Relacionando o documento solicitado com sua finalidade principal.",
  },
  {
    label: "Lendo dados da solicitação",
    description: "Organizando as informações essenciais antes da redação.",
  },
  {
    label: "Mapeando objeto e escopo",
    description: "Separando objeto, justificativas e pontos de atenção.",
  },
  {
    label: "Organizando seções obrigatórias",
    description: "Montando a sequência do documento para manter consistência.",
  },
  {
    label: "Preparando fundamentação",
    description: "Alinhando critérios, contexto técnico e estrutura da minuta.",
  },
  {
    label: "Redigindo conteúdo técnico",
    description: "Transformando a estrutura planejada em texto do documento.",
  },
  {
    label: "Conferindo consistência",
    description: "Revisando continuidade, clareza e coerência entre seções.",
  },
  {
    label: "Formatando preview",
    description: "Ajustando o conteúdo para aparecer na folha do documento.",
  },
  {
    label: "Finalizando geração",
    description: "Preparando a versão final para atualização do preview.",
  },
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

function getPlanningStepIndex({
  planningContent,
  documentContent,
}: {
  planningContent: string;
  documentContent: string;
}) {
  const planningSize = planningContent.trim().length;
  const documentSize = documentContent.trim().length;

  if (documentSize > 1800) {
    return 8;
  }

  if (documentSize > 700) {
    return 7;
  }

  if (documentSize > 0) {
    return 6;
  }

  if (planningSize > 1200) {
    return 5;
  }

  if (planningSize > 760) {
    return 4;
  }

  if (planningSize > 420) {
    return 3;
  }

  if (planningSize > 160) {
    return 2;
  }

  if (planningSize > 40) {
    return 1;
  }

  return 0;
}

const liveWritingFollowThresholdPx = 180;

function isNearScrollBottom(element: HTMLElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= liveWritingFollowThresholdPx
  );
}

function useLiveWritingAutoFollow({
  enabled,
  visibleContentLength,
  endpointRef,
}: {
  enabled: boolean;
  visibleContentLength: number;
  endpointRef: RefObject<HTMLDivElement | null>;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [shouldFollow, setShouldFollow] = useState(enabled);

  useEffect(() => {
    setShouldFollow(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !shouldFollow || visibleContentLength === 0) {
      return;
    }

    endpointRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [enabled, endpointRef, prefersReducedMotion, shouldFollow, visibleContentLength]);

  const handleScroll = useCallback(() => {
    if (!enabled || !scrollContainerRef.current) {
      return;
    }

    setShouldFollow(isNearScrollBottom(scrollContainerRef.current));
  }, [enabled]);

  return {
    handleScroll,
    scrollContainerRef,
  };
}

function DocumentPlanningProgress({
  planningContent,
  documentContent,
}: {
  planningContent: string;
  documentContent: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  const activeStepIndex = getPlanningStepIndex({ planningContent, documentContent });
  const activeStep = planningSteps[activeStepIndex];

  useEffect(() => {
    if (!planningContent.trim()) {
      return;
    }

    stepRefs.current[activeStepIndex]?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [activeStepIndex, planningContent, prefersReducedMotion]);

  if (!planningContent.trim()) {
    return null;
  }

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Preparando documento</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {activeStep.description}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Em análise
          </div>
        </div>

        <div
          className="max-h-56 overflow-y-auto rounded-md border bg-muted/20 px-3 py-2"
          data-testid="planning-stepper-viewport"
        >
          <ol className="relative space-y-1" aria-label="Etapas da geração do documento">
            {planningSteps.map((step, index) => {
              const isComplete = index < activeStepIndex;
              const isActive = index === activeStepIndex;
              const state = isComplete ? "complete" : isActive ? "active" : "pending";

              return (
                <li
                  key={step.label}
                  ref={(element) => {
                    stepRefs.current[index] = element;
                  }}
                  className="relative grid grid-cols-[1.5rem_1fr] gap-3 py-2"
                  data-state={state}
                >
                  {index < planningSteps.length - 1 ? (
                    <span className="absolute left-[0.6875rem] top-7 h-[calc(100%-1rem)] w-px bg-border" />
                  ) : null}
                  <span
                    className={
                      isComplete
                        ? "relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        : isActive
                          ? "relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-primary bg-background shadow-sm motion-safe:animate-pulse"
                          : "relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border bg-background"
                    }
                    aria-hidden="true"
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span
                        className={
                          isActive
                            ? "h-2 w-2 rounded-full bg-primary"
                            : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                        }
                      />
                    )}
                  </span>

                  <div
                    className={
                      isActive ? "rounded-md border bg-background px-3 py-2 shadow-sm" : "px-3 py-2"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={
                          isActive
                            ? "text-sm font-medium text-foreground"
                            : isComplete
                              ? "text-sm font-medium text-muted-foreground"
                              : "text-sm text-muted-foreground"
                        }
                      >
                        {step.label}
                      </p>
                      <span className="text-[11px] font-medium uppercase text-muted-foreground">
                        {isComplete ? "Concluído" : isActive ? "Agora" : "A seguir"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentSheet({
  draftContent,
  draftContentJson = null,
  isGenerating = false,
  letterheadUrl = null,
  liveWritingEndpointRef,
}: {
  draftContent: string;
  draftContentJson?: DocumentEditorJson | null;
  isGenerating?: boolean;
  letterheadUrl?: string | null;
  liveWritingEndpointRef?: RefObject<HTMLDivElement | null>;
}) {
  const bodyRef = useRef<HTMLElement | null>(null);
  const isJsonPreview = Boolean(draftContentJson);

  return (
    <section
      className={getInstitutionalDocumentOutputClassName(
        cn(
          "relative",
          isJsonPreview
            ? "public-document-demo-page document-preview-json-sheet"
            : institutionalDocumentTheme.sheetClassName,
        ),
      )}
      style={isJsonPreview ? undefined : institutionalDocumentThemeTokens}
      data-institutional-document-output
      data-institutional-document-no-branding="true"
      data-institutional-document-sheet
      data-document-sheet
      data-document-letterhead={letterheadUrl ? "true" : undefined}
      data-testid="document-preview-sheet"
      aria-label="Preview do documento"
    >
      {letterheadUrl ? (
        <img
          src={letterheadUrl}
          alt=""
          className="document-letterhead-print-layer"
          data-document-letterhead-print-layer
          aria-hidden="true"
        />
      ) : null}
      <article
        ref={bodyRef}
        className={institutionalDocumentTheme.bodyClassName}
        data-institutional-document-body
        data-document-body
      >
        {isGenerating ? (
          <div
            className={institutionalDocumentTheme.liveStatusClassName}
            data-institutional-document-live-status
            data-document-live-status
          >
            <Spinner className="size-4" aria-label="Gerando documento" />
            Gerando documento em tempo real
          </div>
        ) : null}
        {draftContentJson ? (
          <DocumentTiptapPreview content={draftContentJson} />
        ) : (
          <DocumentMarkdownPreview content={draftContent} />
        )}
        {isGenerating ? (
          <div
            ref={liveWritingEndpointRef}
            className="h-px"
            data-testid="live-writing-endpoint"
            aria-hidden="true"
          />
        ) : null}
      </article>
    </section>
  );
}

function DocumentPagedTiptapBody({ content }: { content: DocumentEditorJson }) {
  const editor = useEditor({
    content,
    editable: false,
    extensions: getDocumentTiptapExtensions(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Preview do documento",
        class: "document-editor-prosemirror document-preview-prosemirror",
        "data-document-body": "true",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(content, { emitUpdate: false });
    editor.setEditable(false);
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}

function DocumentPagedBody({
  source,
}: {
  source: NonNullable<ReturnType<typeof getDocumentPreviewSource>>;
}) {
  if (source.kind === "json") {
    return <DocumentPagedTiptapBody content={source.content} />;
  }

  return <DocumentMarkdownPreview content={source.content} />;
}

export function DocumentPreviewPageUI() {
  const { documentId = "" } = useParams();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const documentQuery = useDocumentDetail(documentId);
  const document = documentQuery.data;
  const refetchDocument = useCallback(() => {
    void documentQuery.refetch();
  }, [documentQuery.refetch]);
  const livePreview = useDocumentGenerationEvents({
    documentId,
    enabled: document?.status === "generating",
    onCompleted: refetchDocument,
    onFailed: refetchDocument,
  });
  const breadcrumbs = useMemo(
    () => ({
      breadcrumbs: getDocumentPreviewBreadcrumbs(document),
    }),
    [document],
  );

  useAppShellHeader(breadcrumbs);

  const previewSource = getDocumentPreviewSource(document);
  const letterheadUrl =
    document?.status === "completed" ? resolveApiAssetUrl(document.letterhead?.url) : null;
  const liveDraftContent =
    document?.status === "generating" ? getPreviewableDraftContent(livePreview.content) : null;
  const canUsePersistedDocument = document?.status === "completed" && Boolean(previewSource);
  const liveWritingEndpointRef = useRef<HTMLDivElement | null>(null);
  const isLiveWritingVisible = document?.status === "generating" && Boolean(liveDraftContent);
  const { handleScroll, scrollContainerRef } = useLiveWritingAutoFollow({
    enabled: isLiveWritingVisible,
    endpointRef: liveWritingEndpointRef,
    visibleContentLength: liveDraftContent?.length ?? 0,
  });
  const handleExportPdf = useCallback(async () => {
    if (!document || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);

    try {
      await exportPagedPreviewToPdf({
        fileName: document.name,
        pages: getPagedPreviewPageElements(scrollContainerRef.current),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível exportar o PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [document, isExportingPdf, scrollContainerRef]);

  if (!documentId) {
    return (
      <DocumentPreviewFailureState
        title="Documento não encontrado"
        description="O identificador do documento não foi informado nesta rota."
        canRetry={false}
      />
    );
  }

  if (documentQuery.isLoading) {
    return <DocumentPreviewLoadingState />;
  }

  if (documentQuery.isError) {
    const errorStatus = documentQuery.error?.status;

    if (errorStatus === 403 || errorStatus === 404) {
      return (
        <DocumentPreviewFailureState
          title="Documento não encontrado"
          description="Não foi possível localizar este documento na área visível da sua sessão."
          canRetry={false}
        />
      );
    }

    return (
      <DocumentPreviewFailureState
        title="Não foi possível carregar o documento"
        description="Verifique a conexão e tente carregar o preview novamente."
        canRetry
        onRetry={() => void documentQuery.refetch()}
      />
    );
  }

  if (!document) {
    return (
      <DocumentPreviewFailureState
        title="Documento não encontrado"
        description="Não foi possível localizar este documento na resposta da API."
        canRetry={false}
      />
    );
  }

  return (
    <main
      ref={scrollContainerRef}
      className="flex-1 overflow-auto bg-muted/30"
      data-institutional-document-preview-root
      data-document-preview-print-root
      data-document-letterhead={letterheadUrl ? "true" : undefined}
      data-testid="document-preview-scroll-container"
      onScroll={handleScroll}
    >
      <div className="p-4 sm:p-6" data-document-preview-workspace>
        <div className="mx-auto max-w-5xl space-y-6" data-document-preview-content>
          <DocumentPreviewActions
            canExportPdf={canUsePersistedDocument}
            canPrint={canUsePersistedDocument}
            documentId={document.id}
            isExportingPdf={isExportingPdf}
            onExportPdf={handleExportPdf}
          />

          {document.status === "generating" ? (
            <>
              <DocumentPlanningProgress
                planningContent={livePreview.planningContent}
                documentContent={liveDraftContent ?? ""}
              />
              {liveDraftContent ? (
                <DocumentSheet
                  draftContent={liveDraftContent}
                  isGenerating
                  letterheadUrl={null}
                  liveWritingEndpointRef={liveWritingEndpointRef}
                />
              ) : (
                <DocumentPreviewStateCard
                  title="Preview em geração"
                  description={
                    livePreview.isUnavailable
                      ? "O acompanhamento em tempo real não está disponível. O preview será atualizado automaticamente quando a geração finalizar."
                      : livePreview.planningContent
                        ? "A IA está analisando o processo. O documento aparecerá assim que o primeiro trecho final estiver disponível."
                        : "O documento ainda está sendo gerado. O preview aparecerá assim que o primeiro trecho estiver disponível."
                  }
                  icon="loading"
                />
              )}
            </>
          ) : document.status === "failed" ? (
            <DocumentPreviewStateCard
              title="Geração do documento falhou"
              description="Não há conteúdo para visualizar porque a geração deste documento terminou com erro."
              icon="alert"
            />
          ) : previewSource ? (
            <PagedDocumentPreview
              letterheadUrl={letterheadUrl ?? undefined}
              renderKey={`${document.id}:${document.updatedAt}:${previewSource.kind}:${
                letterheadUrl ?? "no-letterhead"
              }`}
              showToolbar={false}
              title={document.name}
            >
              <PaperLayout>
                <DocumentPagedBody source={previewSource} />
              </PaperLayout>
            </PagedDocumentPreview>
          ) : (
            <DocumentPreviewStateCard
              title="Documento sem conteúdo"
              description="Este documento está concluído, mas ainda não possui conteúdo salvo para preview."
              icon="file"
            />
          )}
        </div>
      </div>
    </main>
  );
}
