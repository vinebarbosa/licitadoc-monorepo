import { AlertTriangle, Clock, Eye, FileText, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppShellHeader } from "@/modules/app-shell";
import {
  type DocumentAgentEditorContext,
  DocumentAgentEditorExperience,
} from "@/modules/public/pages/document-editor-demo-page";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  getDocumentMutationErrorMessage,
  useDocumentDetail,
  useDocumentSave,
} from "../api/documents";
import { getDocumentJsonContentHash } from "../model/document-editor-content";
import {
  type DocumentEditorJson,
  formatUpdatedAt,
  getDocumentEditBreadcrumbs,
  getDocumentProcessLabel,
  getDocumentResponsibleLabel,
  getDocumentTypeLabel,
  isTiptapDocumentJson,
} from "../model/documents";

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";
type AgentSaveStatus = "saved" | "saving" | "unsaved";

function stringifyEditorContent(value: DocumentEditorJson | null) {
  return value ? JSON.stringify(value) : "";
}

function toAgentSaveStatus(state: SaveState): AgentSaveStatus {
  if (state === "saving") {
    return "saving";
  }

  if (state === "saved") {
    return "saved";
  }

  return "unsaved";
}

function confirmDiscardUnsavedChanges(isDirty: boolean) {
  if (!isDirty) {
    return true;
  }

  return window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?");
}

function DocumentEditLoadingState() {
  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <div className="border-slate-200/70 border-b bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="mx-auto mb-5 h-10 w-full max-w-[760px] rounded-full" />
        <Skeleton className="mx-auto h-[760px] w-full max-w-[900px] rounded-sm" />
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
  action?: "retry";
  description: string;
  icon?: "alert" | "clock" | "file";
  onRetry?: () => void;
  title: string;
}) {
  const Icon = icon === "clock" ? Clock : icon === "file" ? FileText : AlertTriangle;

  return (
    <main className="min-h-screen bg-[#f6f7f9] p-6">
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

export function DocumentEditPageUI() {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();
  const documentQuery = useDocumentDetail(documentId);
  const document = documentQuery.data;
  const saveMutation = useDocumentSave(documentId);
  const [editorContent, setEditorContent] = useState<DocumentEditorJson | null>(null);
  const [savedEditorContentString, setSavedEditorContentString] = useState("");
  const [sourceContentHash, setSourceContentHash] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const breadcrumbs = useMemo(
    () => ({
      breadcrumbs: getDocumentEditBreadcrumbs(document),
    }),
    [document],
  );

  useAppShellHeader(breadcrumbs);

  const editorContentString = stringifyEditorContent(editorContent);
  const isDirty = Boolean(editorContent) && editorContentString !== savedEditorContentString;
  const editableDraftContentJson = isTiptapDocumentJson(document?.draftContentJson)
    ? document.draftContentJson
    : null;
  const canEdit = document?.status === "completed" && Boolean(editableDraftContentJson);
  const contentKey = document
    ? `${document.id}:${document.updatedAt}:${Boolean(document.draftContentJson)}`
    : undefined;

  useEffect(() => {
    if (!canEdit || !editableDraftContentJson) {
      return;
    }

    const nextContentString = stringifyEditorContent(editableDraftContentJson);

    setEditorContent(editableDraftContentJson);
    setSavedEditorContentString(nextContentString);
    setSaveState("saved");
    setSaveError(null);
    void getDocumentJsonContentHash(editableDraftContentJson).then(setSourceContentHash);
  }, [canEdit, editableDraftContentJson]);

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
    if (!documentId || !editorContent || !isDirty || saveMutation.isPending || !sourceContentHash) {
      return;
    }

    setSaveState("saving");
    setSaveError(null);
    saveMutation.mutate(
      {
        documentId,
        data: {
          draftContentJson: editorContent,
          sourceContentHash,
        },
      },
      {
        onSuccess: (updatedDocument) => {
          const nextContent = isTiptapDocumentJson(updatedDocument.draftContentJson)
            ? updatedDocument.draftContentJson
            : editorContent;

          setEditorContent(nextContent);
          setSavedEditorContentString(stringifyEditorContent(nextContent));
          setSaveState("saved");
          setSaveError(null);
          void getDocumentJsonContentHash(nextContent).then(setSourceContentHash);
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
  }, [documentId, editorContent, isDirty, saveMutation, sourceContentHash]);

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

  if (!editableDraftContentJson || !editorContent) {
    return (
      <DocumentEditUnavailableState
        title="Documento sem conteúdo"
        description="Este documento está concluído, mas ainda não possui conteúdo JSON salvo para edição."
        icon="file"
      />
    );
  }

  const editorContext: DocumentAgentEditorContext = {
    number: getDocumentProcessLabel(document),
    organization: "",
    department: "",
    responsible: getDocumentResponsibleLabel(document.responsibles),
    modality: "Documento",
    documentType: getDocumentTypeLabel(document.type),
    documentName: `${document.name} · ${formatUpdatedAt(document.updatedAt)}`,
    status: "Em edição",
  };

  return (
    <main className="relative min-h-screen bg-[#f6f7f9]" data-document-editor-workspace>
      {saveError ? (
        <div className="fixed top-[4.75rem] left-1/2 z-[60] w-[min(720px,calc(100vw-32px))] -translate-x-1/2 rounded-lg border border-destructive/25 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur-xl">
          <div className="font-medium text-destructive">
            {saveState === "conflict" ? "Conteúdo alterado" : "Falha ao salvar"}
          </div>
          <div className="mt-1 text-muted-foreground">{saveError}</div>
        </div>
      ) : null}

      <DocumentAgentEditorExperience
        contentKey={contentKey}
        headerActions={
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
              Voltar
            </Button>
            <Button asChild variant="ghost" size="sm">
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
        }
        initialContent={editorContent}
        onContentChange={(nextContent) => {
          if (!isTiptapDocumentJson(nextContent)) {
            return;
          }

          setEditorContent(nextContent);

          if (saveState === "error" || saveState === "conflict") {
            setSaveError(null);
            setSaveState("dirty");
          }
        }}
        onSaveShortcut={() => void handleSave()}
        processContext={editorContext}
        saveStatus={toAgentSaveStatus(saveState)}
        workspaceTestId="document-editor-real"
      />
    </main>
  );
}
