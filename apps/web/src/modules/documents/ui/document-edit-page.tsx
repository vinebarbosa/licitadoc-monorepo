import { AlertTriangle, CheckCircle2, Clock, Eye, FileText, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppShellHeader } from "@/modules/app-shell";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { PageBackButton } from "@/shared/ui/page-back";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  getDocumentMutationErrorMessage,
  useDocumentDetail,
  useDocumentSave,
} from "../api/documents";
import {
  documentMarkdownToEditorHtml,
  editorHtmlToDocumentMarkdown,
  getDocumentContentHash,
} from "../model/document-editor-content";
import {
  documentStatusConfig,
  formatUpdatedAt,
  getDocumentEditBreadcrumbs,
  getDocumentProcessLabel,
  getDocumentResponsibleLabel,
  getDocumentTypeLabel,
  getPreviewableDraftContent,
} from "../model/documents";
import { DocumentTiptapEditor } from "./document-tiptap-editor";

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";

function DocumentEditLoadingState() {
  return (
    <main className="flex-1 overflow-auto bg-[#f6f7f9]">
      <div className="border-slate-200/70 border-b bg-[#f6f7f9]/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-80" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-8 w-56" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <Skeleton className="mx-auto mb-5 h-10 w-full max-w-[720px] rounded-full" />
        <Skeleton className="mx-auto h-[760px] w-full max-w-[880px] rounded-sm" />
      </div>
    </main>
  );
}

function DocumentEditUnavailableState({
  action,
  description,
  icon = "alert",
  onRetry,
  title,
}: {
  action?: "retry" | "preview";
  description: string;
  icon?: "alert" | "clock" | "file";
  onRetry?: () => void;
  title: string;
}) {
  const Icon = icon === "clock" ? Clock : icon === "file" ? FileText : AlertTriangle;

  return (
    <main className="flex-1 overflow-auto bg-[#f6f7f9] p-6">
      <div className="mx-auto max-w-4xl">
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            {action === "retry" ? (
              <Button type="button" onClick={onRetry}>
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/app/documentos">Voltar para documentos</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  const config = {
    saved: {
      icon: CheckCircle2,
      label: "Salvo",
      className: "border-success/30 bg-success/10 text-success",
    },
    dirty: {
      icon: Clock,
      label: "Alterações não salvas",
      className: "border-pending/30 bg-pending/10 text-pending",
    },
    saving: {
      icon: RefreshCw,
      label: "Salvando",
      className: "border-primary/30 bg-primary/10 text-primary",
    },
    error: {
      icon: AlertTriangle,
      label: "Erro ao salvar",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
    conflict: {
      icon: AlertTriangle,
      label: "Documento alterado",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  } satisfies Record<SaveState, { icon: typeof CheckCircle2; label: string; className: string }>;
  const item = config[state];
  const Icon = item.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-md", item.className)}>
      <Icon className={cn("h-3.5 w-3.5", state === "saving" && "animate-spin")} />
      {item.label}
    </Badge>
  );
}

function confirmDiscardUnsavedChanges(isDirty: boolean) {
  if (!isDirty) {
    return true;
  }

  return window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?");
}

export function DocumentEditPageUI() {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();
  const documentQuery = useDocumentDetail(documentId);
  const document = documentQuery.data;
  const saveMutation = useDocumentSave(documentId);
  const breadcrumbs = useMemo(
    () => ({
      breadcrumbs: getDocumentEditBreadcrumbs(document),
    }),
    [document],
  );

  useAppShellHeader(breadcrumbs);

  const [editorHtml, setEditorHtml] = useState("");
  const [savedDraftContent, setSavedDraftContent] = useState("");
  const [sourceContentHash, setSourceContentHash] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const isHydratingEditorRef = useRef(false);
  const currentDraftContent = useMemo(() => editorHtmlToDocumentMarkdown(editorHtml), [editorHtml]);
  const isDirty = currentDraftContent !== savedDraftContent;
  const editableDraftContent = getPreviewableDraftContent(document?.draftContent);
  const canEdit = document?.status === "completed" && Boolean(editableDraftContent);

  useEffect(() => {
    if (!canEdit || !editableDraftContent) {
      return;
    }

    const initialHtml = documentMarkdownToEditorHtml(editableDraftContent);

    isHydratingEditorRef.current = true;
    setSavedDraftContent(editorHtmlToDocumentMarkdown(initialHtml));
    setEditorHtml(initialHtml);
    setSaveState("saved");
    setSaveError(null);

    void getDocumentContentHash(editableDraftContent).then(setSourceContentHash);
  }, [canEdit, editableDraftContent]);

  useEffect(() => {
    if (saveMutation.isPending) {
      setSaveState("saving");
      return;
    }

    if (saveState === "error" || saveState === "conflict") {
      return;
    }

    setSaveState(isDirty ? "dirty" : "saved");
  }, [isDirty, saveMutation.isPending, saveState]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSave = useCallback(async () => {
    if (!documentId || !isDirty || saveMutation.isPending || !sourceContentHash) {
      return;
    }

    setSaveState("saving");
    setSaveError(null);
    saveMutation.mutate(
      {
        documentId,
        data: {
          draftContent: currentDraftContent,
          sourceContentHash,
        },
      },
      {
        onSuccess: (updatedDocument) => {
          const nextContent = updatedDocument.draftContent ?? "";

          setSavedDraftContent(nextContent);
          setEditorHtml(documentMarkdownToEditorHtml(nextContent));
          setSaveState("saved");
          setSaveError(null);
          void getDocumentContentHash(nextContent).then(setSourceContentHash);
        },
        onError: (error) => {
          const isConflict = error?.status === 409;

          setSaveState(isConflict ? "conflict" : "error");
          setSaveError(
            getDocumentMutationErrorMessage(
              error,
              isConflict
                ? "O documento foi alterado antes deste salvamento terminar."
                : "Não foi possível salvar o documento.",
            ),
          );
        },
      },
    );
  }, [currentDraftContent, documentId, isDirty, saveMutation, sourceContentHash]);

  const handleBack = useCallback(() => {
    if (!confirmDiscardUnsavedChanges(isDirty)) {
      return;
    }

    const historyState = window.history.state as { idx?: number } | null;

    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }

    navigate("/app/documentos", { replace: true });
  }, [isDirty, navigate]);

  if (!documentId) {
    return (
      <DocumentEditUnavailableState
        title="Documento não encontrado"
        description="O identificador do documento não foi informado nesta rota."
      />
    );
  }

  if (documentQuery.isLoading) {
    return <DocumentEditLoadingState />;
  }

  if (documentQuery.isError) {
    const errorStatus = documentQuery.error?.status;

    if (errorStatus === 403 || errorStatus === 404) {
      return (
        <DocumentEditUnavailableState
          title="Documento não encontrado"
          description="Não foi possível localizar este documento na área visível da sua sessão."
        />
      );
    }

    return (
      <DocumentEditUnavailableState
        title="Não foi possível carregar o documento"
        description="Verifique a conexão e tente carregar a edição novamente."
        action="retry"
        onRetry={() => void documentQuery.refetch()}
      />
    );
  }

  if (!document) {
    return (
      <DocumentEditUnavailableState
        title="Documento não encontrado"
        description="Não foi possível localizar este documento na resposta da API."
      />
    );
  }

  if (document.status === "generating") {
    return (
      <DocumentEditUnavailableState
        title="Documento em geração"
        description="A edição ficará disponível quando a geração do documento for concluída."
        icon="clock"
      />
    );
  }

  if (document.status === "failed") {
    return (
      <DocumentEditUnavailableState
        title="Geração do documento falhou"
        description="Não há conteúdo seguro para editar porque a geração terminou com erro."
      />
    );
  }

  if (!editableDraftContent) {
    return (
      <DocumentEditUnavailableState
        title="Documento sem conteúdo"
        description="Este documento está concluído, mas ainda não possui conteúdo salvo para edição."
        icon="file"
      />
    );
  }

  const statusConfig = documentStatusConfig.concluido;
  const StatusIcon = statusConfig.icon;

  return (
    <main
      className="document-editor-focus-workspace flex-1 overflow-auto bg-[#f6f7f9]"
      data-document-editor-workspace
    >
      <section
        className="sticky top-0 z-30 border-slate-200/70 border-b bg-[#f6f7f9]/90 px-4 py-3 backdrop-blur-xl sm:px-6"
        data-document-editor-topbar
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <PageBackButton onClick={handleBack} />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">{document.name}</h1>
              <div
                className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs"
                data-document-editor-metadata
              >
                <span>{getDocumentTypeLabel(document.type)}</span>
                <span className="hidden text-slate-300 sm:inline">/</span>
                <span className="inline-flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </span>
                <span className="hidden text-slate-300 sm:inline">/</span>
                <Link
                  to={`/app/processo/${document.processId}`}
                  className="font-medium text-primary/80 underline-offset-4 hover:text-primary hover:underline"
                  onClick={(event) => {
                    if (!confirmDiscardUnsavedChanges(isDirty)) {
                      event.preventDefault();
                    }
                  }}
                >
                  {getDocumentProcessLabel(document)}
                </Link>
                <span className="hidden text-slate-300 sm:inline">/</span>
                <span>{getDocumentResponsibleLabel(document.responsibles)}</span>
                <span className="hidden text-slate-300 sm:inline">/</span>
                <span>{formatUpdatedAt(document.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <SaveStatus state={saveState} />
            <Button asChild variant="ghost" size="sm" className="bg-white/60 shadow-xs">
              <Link
                to={`/app/documento/${documentId}/preview`}
                onClick={(event) => {
                  if (!confirmDiscardUnsavedChanges(isDirty)) {
                    event.preventDefault();
                  }
                }}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              className="shadow-xs"
              disabled={!isDirty || saveMutation.isPending || !sourceContentHash}
              onClick={() => void handleSave()}
            >
              {saveMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-4 px-3 py-6 sm:px-6 lg:py-8">
        {saveError ? (
          <div className="mx-auto max-w-3xl rounded-md border border-destructive/25 bg-white/90 px-4 py-3 text-sm shadow-sm">
            <div className="font-medium text-destructive">
              {saveState === "conflict" ? "Conteúdo alterado" : "Falha ao salvar"}
            </div>
            <div className="mt-1 text-muted-foreground">{saveError}</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={saveMutation.isPending}
              onClick={() => void handleSave()}
            >
              Tentar salvar novamente
            </Button>
          </div>
        ) : null}

        <DocumentTiptapEditor
          content={editorHtml}
          onChange={(html) => {
            if (isHydratingEditorRef.current) {
              isHydratingEditorRef.current = false;
              setSavedDraftContent(editorHtmlToDocumentMarkdown(html));
              setEditorHtml(html);
              setSaveState("saved");
              return;
            }

            setEditorHtml(html);
            if (saveState === "error" || saveState === "conflict") {
              setSaveError(null);
              setSaveState("dirty");
            }
          }}
          onSaveShortcut={() => void handleSave()}
        />
      </div>
    </main>
  );
}
