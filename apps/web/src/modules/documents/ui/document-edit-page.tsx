import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import {
  AlertTriangle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Clock,
  Cloud,
  Eye,
  FileText,
  Heading,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  RefreshCw,
  Save,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppShellHeader } from "@/modules/app-shell";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  getDocumentMutationErrorMessage,
  useDocumentDetail,
  useDocumentSave,
} from "../api/documents";
import { getDocumentJsonContentHash } from "../model/document-editor-content";
import {
  type DocumentEditorJson,
  getDocumentEditBreadcrumbs,
  getDocumentProcessLabel,
  getDocumentTypeLabel,
  isTiptapDocumentJson,
} from "../model/documents";
import { getDocumentTiptapExtensions, handleEditorTab } from "./document-tiptap-extensions";

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";
type TextAlignValue = "left" | "center" | "right" | "justify";
type EditorStatus = "saved" | "saving" | "unsaved";
type StoredEditorSelection = { from: number; to: number };
type EditorCommandChain = ReturnType<Editor["chain"]>;

function stringifyEditorContent(value: DocumentEditorJson | null) {
  return value ? JSON.stringify(value) : "";
}

function toEditorStatus(state: SaveState): EditorStatus {
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

const activeToolButtonClass = "bg-primary/10 text-primary hover:bg-primary/15";
const activeToolMenuItemClass = "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary";
const editorToolButtonClass =
  "text-muted-foreground hover:bg-primary/5 hover:text-foreground data-[state=open]:bg-primary/5";

function SaveIndicator({ status }: { status: EditorStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
        <span>Salvando...</span>
      </span>
    );
  }

  if (status === "unsaved") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Clock className="h-3.5 w-3.5 text-warning" />
        <span>Alterações não salvas</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
      <Cloud className="h-3.5 w-3.5 text-success" />
      <span>Salvo</span>
    </span>
  );
}

function EditorToolButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={active ?? undefined}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
          className={cn(editorToolButtonClass, active && activeToolButtonClass)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarSeparator() {
  return (
    <Separator
      orientation="vertical"
      className="mx-1 hidden data-[orientation=vertical]:h-5 sm:block"
    />
  );
}

function DocumentEditorHeader({
  documentId,
  documentName,
  documentSubtitle,
  editor,
  isDirty,
  onBack,
  onSave,
  saveDisabled,
  saveStatus,
  selection,
}: {
  documentId: string;
  documentName: string;
  documentSubtitle: string;
  editor: Editor | null;
  isDirty: boolean;
  onBack: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  saveStatus: EditorStatus;
  selection: StoredEditorSelection | null;
}) {
  const restoreSelection = () => {
    const chain = editor?.chain().focus();

    if (!chain || !editor || !selection) {
      return chain;
    }

    const documentSize = editor.state.doc.content.size;

    if (selection.from < 0 || selection.to > documentSize || selection.from > selection.to) {
      return chain;
    }

    return chain.setTextSelection(selection);
  };

  const runEditorCommand = (command: (chain: EditorCommandChain) => void) => {
    const chain = restoreSelection();

    if (!chain) {
      return;
    }

    command(chain);
  };

  const setTextAlign = (alignment: TextAlignValue) => {
    runEditorCommand((chain) => chain.setTextAlign(alignment).run());
  };

  return (
    <header className="sticky top-0 z-40 border-slate-200/80 border-b bg-white/95 shadow-[0_1px_0_rgb(15_23_42_/_0.03)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-5">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-semibold text-sm">{documentName}</h1>
              <p className="truncate text-muted-foreground text-xs">{documentSubtitle}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <SaveIndicator status={saveStatus} />
            <Button type="button" variant="ghost" size="sm" onClick={onBack}>
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
            <Button type="button" size="sm" disabled={saveDisabled} onClick={onSave}>
              {saveStatus === "saving" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        <div
          role="toolbar"
          aria-label="Ferramentas de formatação"
          className="flex min-h-11 items-center gap-1 overflow-x-auto border-slate-200/70 border-t py-1.5"
        >
          <EditorToolButton
            label="Desfazer"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Refazer"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </EditorToolButton>

          <ToolbarSeparator />

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Estilo do bloco"
                    className={cn(
                      "h-8 gap-1 px-2",
                      editorToolButtonClass,
                      (editor?.isActive("heading", { level: 1 }) ||
                        editor?.isActive("heading", { level: 2 }) ||
                        editor?.isActive("heading", { level: 3 })) &&
                        activeToolButtonClass,
                    )}
                  >
                    <Heading className="h-4 w-4" />
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Estilo do bloco</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className={cn(editor?.isActive("paragraph") && activeToolMenuItemClass)}
                onSelect={() => runEditorCommand((chain) => chain.setParagraph().run())}
              >
                Parágrafo
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(editor?.isActive("heading", { level: 1 }) && activeToolMenuItemClass)}
                onSelect={() =>
                  runEditorCommand((chain) => chain.toggleHeading({ level: 1 }).run())
                }
              >
                Título 1
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(editor?.isActive("heading", { level: 2 }) && activeToolMenuItemClass)}
                onSelect={() =>
                  runEditorCommand((chain) => chain.toggleHeading({ level: 2 }).run())
                }
              >
                Título 2
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(editor?.isActive("heading", { level: 3 }) && activeToolMenuItemClass)}
                onSelect={() =>
                  runEditorCommand((chain) => chain.toggleHeading({ level: 3 }).run())
                }
              >
                Título 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Listas"
                    className={cn(
                      "h-8 gap-1 px-2",
                      editorToolButtonClass,
                      (editor?.isActive("bulletList") || editor?.isActive("orderedList")) &&
                        activeToolButtonClass,
                    )}
                  >
                    <List className="h-4 w-4" />
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Listas</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className={cn(editor?.isActive("bulletList") && activeToolMenuItemClass)}
                onSelect={() => runEditorCommand((chain) => chain.toggleBulletList().run())}
              >
                <List className="h-4 w-4" />
                Lista com marcadores
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(editor?.isActive("orderedList") && activeToolMenuItemClass)}
                onSelect={() => runEditorCommand((chain) => chain.toggleOrderedList().run())}
              >
                <ListOrdered className="h-4 w-4" />
                Lista numerada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarSeparator />

          <EditorToolButton
            label="Negrito"
            active={editor?.isActive("bold")}
            onClick={() => runEditorCommand((chain) => chain.toggleBold().run())}
          >
            <Bold className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Itálico"
            active={editor?.isActive("italic")}
            onClick={() => runEditorCommand((chain) => chain.toggleItalic().run())}
          >
            <Italic className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Tachado"
            active={editor?.isActive("strike")}
            onClick={() => runEditorCommand((chain) => chain.toggleStrike().run())}
          >
            <Strikethrough className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Sublinhado"
            active={editor?.isActive("underline")}
            onClick={() => runEditorCommand((chain) => chain.toggleUnderline().run())}
          >
            <UnderlineIcon className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Destacar texto"
            active={editor?.isActive("highlight")}
            onClick={() => runEditorCommand((chain) => chain.toggleHighlight().run())}
          >
            <Highlighter className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Link"
            active={editor?.isActive("link")}
            onClick={() => {
              if (!editor) {
                return;
              }

              const previousUrl = editor.getAttributes("link").href;
              const url = window.prompt("URL do link", previousUrl ?? "");

              if (url === null) {
                return;
              }

              if (!url.trim()) {
                runEditorCommand((chain) => chain.extendMarkRange("link").unsetLink().run());
                return;
              }

              runEditorCommand((chain) =>
                chain.extendMarkRange("link").setLink({ href: url.trim() }).run(),
              );
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </EditorToolButton>

          <ToolbarSeparator />

          <EditorToolButton
            label="Alinhar à esquerda"
            active={editor?.isActive({ textAlign: "left" })}
            onClick={() => setTextAlign("left")}
          >
            <AlignLeft className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Centralizar"
            active={editor?.isActive({ textAlign: "center" })}
            onClick={() => setTextAlign("center")}
          >
            <AlignCenter className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Alinhar à direita"
            active={editor?.isActive({ textAlign: "right" })}
            onClick={() => setTextAlign("right")}
          >
            <AlignRight className="h-4 w-4" />
          </EditorToolButton>
          <EditorToolButton
            label="Justificar"
            active={editor?.isActive({ textAlign: "justify" })}
            onClick={() => setTextAlign("justify")}
          >
            <AlignJustify className="h-4 w-4" />
          </EditorToolButton>
        </div>
      </div>
    </header>
  );
}

function DocumentEditWorkspace({
  content,
  contentKey,
  documentId,
  documentName,
  documentSubtitle,
  isDirty,
  onBack,
  onContentChange,
  onSave,
  onSaveShortcut,
  saveDisabled,
  saveStatus,
}: {
  content: DocumentEditorJson;
  contentKey?: string;
  documentId: string;
  documentName: string;
  documentSubtitle: string;
  isDirty: boolean;
  onBack: () => void;
  onContentChange: (content: DocumentEditorJson) => void;
  onSave: () => void;
  onSaveShortcut: () => void;
  saveDisabled: boolean;
  saveStatus: EditorStatus;
}) {
  const lastContentKeyRef = useRef<string | undefined>(undefined);
  const lastSelectionRef = useRef<StoredEditorSelection | null>(null);
  const [, setEditorRevision] = useState(0);
  const rememberSelection = useCallback((currentEditor: Editor) => {
    if (currentEditor.view.hasFocus()) {
      const { from, to } = currentEditor.state.selection;

      lastSelectionRef.current = { from, to };
    }

    setEditorRevision((value) => value + 1);
  }, []);
  const editor = useEditor({
    extensions: getDocumentTiptapExtensions({
      includeKeyboardShortcuts: true,
      includePlaceholder: true,
    }),
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Editor do documento",
        class: "document-editor-prosemirror public-document-demo-prosemirror",
      },
    },
    onSelectionUpdate: ({ editor: currentEditor }) => rememberSelection(currentEditor),
    onTransaction: () => setEditorRevision((value) => value + 1),
    onUpdate: ({ editor: currentEditor }) => {
      const nextContent = currentEditor.getJSON();

      if (isTiptapDocumentJson(nextContent)) {
        onContentChange(nextContent);
      }
    },
  });

  useEffect(() => {
    if (!editor || lastContentKeyRef.current === contentKey) {
      return;
    }

    lastContentKeyRef.current = contentKey;
    editor.commands.setContent(content, { emitUpdate: false });
    setEditorRevision((value) => value + 1);
  }, [content, contentKey, editor]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const eventTarget = event.target;
      const isEditorEventTarget =
        eventTarget instanceof HTMLElement && Boolean(editor?.view.dom.contains(eventTarget));
      const isTypingInField =
        eventTarget instanceof HTMLInputElement ||
        eventTarget instanceof HTMLTextAreaElement ||
        (eventTarget instanceof HTMLElement &&
          eventTarget.isContentEditable &&
          !isEditorEventTarget);

      if (event.key === "Tab" && editor && isEditorEventTarget) {
        event.preventDefault();
        event.stopPropagation();
        handleEditorTab(editor, event.shiftKey ? -1 : 1);
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "s" &&
        !isTypingInField
      ) {
        event.preventDefault();
        onSaveShortcut();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, onSaveShortcut]);

  return (
    <>
      <DocumentEditorHeader
        documentId={documentId}
        documentName={documentName}
        documentSubtitle={documentSubtitle}
        editor={editor}
        isDirty={isDirty}
        onBack={onBack}
        onSave={onSave}
        saveDisabled={saveDisabled}
        saveStatus={saveStatus}
        selection={lastSelectionRef.current}
      />
      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 lg:py-7">
        <div className="public-document-demo-sheet mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
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

  return (
    <TooltipProvider delayDuration={200}>
      <main
        className="public-document-demo-page relative min-h-screen bg-[#f6f7f9]"
        data-document-editor-workspace
      >
        {saveError ? (
          <div className="fixed top-[7.5rem] left-1/2 z-[60] w-[min(720px,calc(100vw-32px))] -translate-x-1/2 rounded-lg border border-destructive/25 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur-xl">
            <div className="font-medium text-destructive">
              {saveState === "conflict" ? "Conteúdo alterado" : "Falha ao salvar"}
            </div>
            <div className="mt-1 text-muted-foreground">{saveError}</div>
          </div>
        ) : null}

        <DocumentEditWorkspace
          content={editorContent}
          contentKey={contentKey}
          documentId={documentId}
          documentName={document.name}
          documentSubtitle={`${getDocumentTypeLabel(document.type)} · Processo ${getDocumentProcessLabel(document)}`}
          isDirty={isDirty}
          onContentChange={(nextContent) => {
            setEditorContent(nextContent);

            if (saveState === "error" || saveState === "conflict") {
              setSaveError(null);
              setSaveState("dirty");
            }
          }}
          onBack={handleBack}
          onSave={() => void handleSave()}
          onSaveShortcut={() => void handleSave()}
          saveDisabled={!isDirty || saveMutation.isPending || !sourceContentHash}
          saveStatus={toEditorStatus(saveState)}
        />
      </main>
    </TooltipProvider>
  );
}
