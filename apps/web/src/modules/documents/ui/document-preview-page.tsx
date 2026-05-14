import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppShellHeader } from "@/modules/app-shell";
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
import { Textarea } from "@/shared/ui/textarea";
import {
  getDocumentMutationErrorMessage,
  useDocumentDetail,
  useDocumentGenerationEvents,
  useDocumentTextAdjustmentApply,
  useDocumentTextAdjustmentSuggestion,
} from "../api/documents";
import { getDocumentPreviewBreadcrumbs, getPreviewableDraftContent } from "../model/documents";
import { DocumentMarkdownPreview } from "./document-markdown-preview";
import {
  getInstitutionalDocumentOutputClassName,
  institutionalDocumentTheme,
  institutionalDocumentThemeTokens,
} from "./institutional-document-theme";

type DocumentTextSelection = {
  selectionContext?: {
    prefix?: string;
    suffix?: string;
  };
  selectedText: string;
};

type DocumentTextAdjustmentSuggestion = {
  replacementText: string;
  selectedText: string;
  sourceContentHash: string;
  sourceTarget: { start: number; end: number; sourceText: string };
};

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

function DocumentPreviewActions({ canPrint = false }: { canPrint?: boolean }) {
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
        <Button type="button" size="sm" disabled={!canPrint}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
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
  icon: "clock" | "alert" | "file";
}) {
  const Icon = icon === "clock" ? Clock : icon === "alert" ? AlertTriangle : FileText;

  return (
    <Card>
      <CardContent className="p-8">
        <Empty className="py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon className="h-6 w-6" />
            </EmptyMedia>
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

function getSelectionContext(draftContent: string, selectedText: string) {
  const index = draftContent.indexOf(selectedText);

  if (index < 0) {
    return undefined;
  }

  return {
    prefix: draftContent.slice(Math.max(0, index - 500), index),
    suffix: draftContent.slice(index + selectedText.length, index + selectedText.length + 500),
  };
}

function DocumentTextAdjustmentPanel({
  errorMessage,
  instruction,
  isApplying,
  isSuggesting,
  onApply,
  onDiscardSuggestion,
  onDismiss,
  onInstructionChange,
  onSubmit,
  selection,
  suggestion,
}: {
  errorMessage: string | null;
  instruction: string;
  isApplying: boolean;
  isSuggesting: boolean;
  onApply: () => void;
  onDiscardSuggestion: () => void;
  onDismiss: () => void;
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  selection: DocumentTextSelection;
  suggestion: DocumentTextAdjustmentSuggestion | null;
}) {
  return (
    <div
      className="fixed top-1/2 left-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl"
      data-document-text-adjustment-panel
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Ajustar texto
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onDismiss}>
          Fechar
        </Button>
      </div>

      <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{selection.selectedText}</p>

      {suggestion ? (
        <div className="space-y-3">
          <div className="rounded-md border bg-background/80 p-3 text-sm leading-relaxed">
            {suggestion.replacementText}
          </div>
          {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDiscardSuggestion}
              disabled={isApplying}
            >
              Descartar
            </Button>
            <Button type="button" size="sm" onClick={onApply} disabled={isApplying}>
              {isApplying ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              Aplicar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={instruction}
            onChange={(event) => onInstructionChange(event.target.value)}
            placeholder="Ex.: deixe mais objetivo, mantendo o tom formal"
            className="min-h-20 resize-none"
            disabled={isSuggesting}
          />
          {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={onSubmit} disabled={isSuggesting}>
              {isSuggesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles />}
              Gerar ajuste
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentSheet({
  draftContent,
  isGenerating = false,
  liveWritingEndpointRef,
  onTextSelection,
}: {
  draftContent: string;
  isGenerating?: boolean;
  liveWritingEndpointRef?: RefObject<HTMLDivElement | null>;
  onTextSelection?: (selection: { rect: DOMRect; selectedText: string }) => void;
}) {
  const bodyRef = useRef<HTMLElement | null>(null);
  const handleTextSelection = useCallback(() => {
    if (!onTextSelection || !bodyRef.current) {
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";

    if (!selection || selectedText.length === 0 || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (
      !bodyRef.current.contains(range.commonAncestorContainer) ||
      range.getBoundingClientRect().width === 0
    ) {
      return;
    }

    onTextSelection({
      rect: range.getBoundingClientRect(),
      selectedText,
    });
  }, [onTextSelection]);

  return (
    <section
      className={getInstitutionalDocumentOutputClassName(institutionalDocumentTheme.sheetClassName)}
      style={institutionalDocumentThemeTokens}
      data-institutional-document-output
      data-institutional-document-no-branding="true"
      data-institutional-document-sheet
      data-document-sheet
      data-testid="document-preview-sheet"
      aria-label="Preview do documento"
      onMouseUp={handleTextSelection}
      onKeyUp={handleTextSelection}
    >
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
            <Clock className="h-4 w-4" />
            Gerando documento em tempo real
          </div>
        ) : null}
        <DocumentMarkdownPreview content={draftContent} />
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

export function DocumentPreviewPageUI() {
  const { documentId = "" } = useParams();
  const documentQuery = useDocumentDetail(documentId);
  const document = documentQuery.data;
  const suggestionMutation = useDocumentTextAdjustmentSuggestion();
  const applyAdjustmentMutation = useDocumentTextAdjustmentApply(documentId);
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

  const draftContent = getPreviewableDraftContent(document?.draftContent);
  const liveDraftContent =
    document?.status === "generating" ? getPreviewableDraftContent(livePreview.content) : null;
  const canUsePersistedDocument = document?.status === "completed" && Boolean(draftContent);
  const canAdjustDocumentText = canUsePersistedDocument && Boolean(draftContent);
  const liveWritingEndpointRef = useRef<HTMLDivElement | null>(null);
  const [textSelection, setTextSelection] = useState<DocumentTextSelection | null>(null);
  const [adjustmentInstruction, setAdjustmentInstruction] = useState("");
  const [adjustmentSuggestion, setAdjustmentSuggestion] =
    useState<DocumentTextAdjustmentSuggestion | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const isLiveWritingVisible = document?.status === "generating" && Boolean(liveDraftContent);
  const { handleScroll, scrollContainerRef } = useLiveWritingAutoFollow({
    enabled: isLiveWritingVisible,
    endpointRef: liveWritingEndpointRef,
    visibleContentLength: liveDraftContent?.length ?? 0,
  });
  const resetTextAdjustment = useCallback(() => {
    setTextSelection(null);
    setAdjustmentInstruction("");
    setAdjustmentSuggestion(null);
    setAdjustmentError(null);
  }, []);
  const handleDocumentTextSelection = useCallback(
    ({ selectedText }: { rect: DOMRect; selectedText: string }) => {
      if (!canAdjustDocumentText || !draftContent) {
        return;
      }

      setTextSelection({
        selectedText,
        selectionContext: getSelectionContext(draftContent, selectedText),
      });
      setAdjustmentInstruction("");
      setAdjustmentSuggestion(null);
      setAdjustmentError(null);
    },
    [canAdjustDocumentText, draftContent],
  );
  const handleSuggestAdjustment = useCallback(() => {
    if (!textSelection) {
      return;
    }

    const instruction = adjustmentInstruction.trim();

    if (!instruction) {
      setAdjustmentError("Digite o que deseja alterar neste trecho.");
      return;
    }

    setAdjustmentError(null);
    suggestionMutation.mutate(
      {
        documentId,
        data: {
          selectedText: textSelection.selectedText,
          instruction,
          selectionContext: textSelection.selectionContext,
        },
      },
      {
        onSuccess: (response) => {
          setAdjustmentSuggestion(response);
        },
        onError: (error) => {
          setAdjustmentError(
            getDocumentMutationErrorMessage(error, "Não foi possível gerar o ajuste."),
          );
        },
      },
    );
  }, [adjustmentInstruction, documentId, suggestionMutation, textSelection]);
  const handleApplyAdjustment = useCallback(() => {
    if (!adjustmentSuggestion) {
      return;
    }

    setAdjustmentError(null);
    applyAdjustmentMutation.mutate(
      {
        documentId,
        data: {
          sourceTarget: adjustmentSuggestion.sourceTarget,
          replacementText: adjustmentSuggestion.replacementText,
          sourceContentHash: adjustmentSuggestion.sourceContentHash,
        },
      },
      {
        onSuccess: () => {
          resetTextAdjustment();
        },
        onError: (error) => {
          setAdjustmentError(
            getDocumentMutationErrorMessage(error, "Não foi possível aplicar o ajuste."),
          );
        },
      },
    );
  }, [adjustmentSuggestion, applyAdjustmentMutation, documentId, resetTextAdjustment]);

  useEffect(() => {
    if (!canAdjustDocumentText) {
      resetTextAdjustment();
    }
  }, [canAdjustDocumentText, resetTextAdjustment]);

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
      data-testid="document-preview-scroll-container"
      onScroll={handleScroll}
    >
      <div className="p-4 sm:p-6" data-document-preview-workspace>
        <div className="mx-auto max-w-5xl space-y-6" data-document-preview-content>
          <DocumentPreviewActions canPrint={canUsePersistedDocument} />

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
                  icon="clock"
                />
              )}
            </>
          ) : document.status === "failed" ? (
            <DocumentPreviewStateCard
              title="Geração do documento falhou"
              description="Não há conteúdo para visualizar porque a geração deste documento terminou com erro."
              icon="alert"
            />
          ) : draftContent ? (
            <>
              <DocumentSheet
                draftContent={draftContent}
                onTextSelection={canAdjustDocumentText ? handleDocumentTextSelection : undefined}
              />
              {textSelection ? (
                <DocumentTextAdjustmentPanel
                  selection={textSelection}
                  instruction={adjustmentInstruction}
                  suggestion={adjustmentSuggestion}
                  errorMessage={adjustmentError}
                  isSuggesting={suggestionMutation.isPending}
                  isApplying={applyAdjustmentMutation.isPending}
                  onInstructionChange={setAdjustmentInstruction}
                  onSubmit={handleSuggestAdjustment}
                  onApply={handleApplyAdjustment}
                  onDiscardSuggestion={() => {
                    setAdjustmentSuggestion(null);
                    setAdjustmentError(null);
                  }}
                  onDismiss={resetTextAdjustment}
                />
              ) : null}
            </>
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
