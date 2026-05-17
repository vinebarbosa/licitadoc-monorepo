import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { institutionalDocumentThemeTokens } from "./institutional-document-theme";

type DocumentTiptapEditorProps = {
  content: string;
  editable?: boolean;
  onChange: (html: string) => void;
  onSaveShortcut?: () => void;
};

type ToolbarButton = {
  label: string;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
  onClick: (editor: Editor) => void;
  icon: typeof Bold;
};

const toolbarGroups: ToolbarButton[][] = [
  [
    {
      label: "Parágrafo",
      icon: Pilcrow,
      isActive: (editor) => editor.isActive("paragraph"),
      onClick: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      label: "Título 1",
      icon: Heading1,
      isActive: (editor) => editor.isActive("heading", { level: 1 }),
      onClick: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Título 2",
      icon: Heading2,
      isActive: (editor) => editor.isActive("heading", { level: 2 }),
      onClick: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
  ],
  [
    {
      label: "Negrito",
      icon: Bold,
      isActive: (editor) => editor.isActive("bold"),
      onClick: (editor) => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Itálico",
      icon: Italic,
      isActive: (editor) => editor.isActive("italic"),
      onClick: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Sublinhado",
      icon: UnderlineIcon,
      isActive: (editor) => editor.isActive("underline"),
      onClick: (editor) => editor.chain().focus().toggleUnderline().run(),
    },
  ],
  [
    {
      label: "Lista com marcadores",
      icon: List,
      isActive: (editor) => editor.isActive("bulletList"),
      onClick: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Lista numerada",
      icon: ListOrdered,
      isActive: (editor) => editor.isActive("orderedList"),
      onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Citação",
      icon: Quote,
      isActive: (editor) => editor.isActive("blockquote"),
      onClick: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
  ],
  [
    {
      label: "Link",
      icon: Link,
      isActive: (editor) => editor.isActive("link"),
      onClick: (editor) => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL do link", previousUrl ?? "");

        if (url === null) {
          return;
        }

        if (!url.trim()) {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
      },
    },
  ],
  [
    {
      label: "Desfazer",
      icon: Undo2,
      isDisabled: (editor) => !editor.can().undo(),
      onClick: (editor) => editor.chain().focus().undo().run(),
    },
    {
      label: "Refazer",
      icon: Redo2,
      isDisabled: (editor) => !editor.can().redo(),
      onClick: (editor) => editor.chain().focus().redo().run(),
    },
  ],
];

function ToolbarIconButton({ button, editor }: { button: ToolbarButton; editor: Editor }) {
  const Icon = button.icon;
  const isActive = button.isActive?.(editor) ?? false;
  const isDisabled = button.isDisabled?.(editor) ?? false;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isActive ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label={button.label}
          aria-pressed={button.isActive ? isActive : undefined}
          disabled={isDisabled}
          className={cn(
            "h-7 w-7 text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            isActive && "bg-slate-100 text-primary hover:bg-slate-100",
          )}
          onClick={() => button.onClick(editor)}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{button.label}</TooltipContent>
    </Tooltip>
  );
}

export function DocumentTiptapEditor({
  content,
  editable = true,
  onChange,
  onSaveShortcut,
}: DocumentTiptapEditorProps) {
  const editor = useEditor({
    content,
    editable,
    extensions: [
      StarterKit.configure({
        link: {
          autolink: true,
          defaultProtocol: "https",
          openOnClick: false,
        },
      }),
    ],
    editorProps: {
      attributes: {
        "aria-label": "Editor do documento",
        class: "document-editor-prosemirror",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === content) {
      return;
    }

    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (!onSaveShortcut) {
      return;
    }

    const handleSaveShortcut = onSaveShortcut;

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSaveShortcut();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSaveShortcut]);

  if (!editor) {
    return null;
  }

  return (
    <section className="document-editor-surface">
      <div className="sticky top-[5.5rem] z-20 mb-5 flex justify-center px-2 sm:top-[4.75rem]">
        <div
          role="toolbar"
          className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-slate-200/80 bg-white/90 px-2 py-1 shadow-[0_10px_30px_rgb(15_23_42_/_0.08)] backdrop-blur-xl"
          aria-label="Ferramentas do editor"
        >
          {toolbarGroups.map((group, index) => (
            <div
              key={group.map((button) => button.label).join(":")}
              className={cn(
                "flex items-center gap-0.5",
                index > 0 && "border-slate-200 border-l pl-1",
              )}
            >
              {group.map((button) => (
                <ToolbarIconButton key={button.label} button={button} editor={editor} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="document-editor-page-area px-0 pb-12 sm:px-2 lg:pb-16">
        <div className="mx-auto w-full overflow-x-auto pb-2">
          <div
            className="institutional-document-output institutional-document-sheet document-editor-sheet"
            style={institutionalDocumentThemeTokens}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </section>
  );
}
