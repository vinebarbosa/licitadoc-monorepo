import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { DocumentPaginationSurface } from "./document-pagination-surface";
import { getDocumentTiptapExtensions } from "./document-tiptap-extensions";

type DocumentTiptapPreviewProps = {
  className?: string;
  content: JSONContent;
};

export function DocumentTiptapPreview({ className, content }: DocumentTiptapPreviewProps) {
  const editor = useEditor({
    content,
    editable: false,
    extensions: getDocumentTiptapExtensions(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Preview do documento",
        class: cn(
          "document-editor-prosemirror public-document-demo-prosemirror document-preview-prosemirror",
          className,
        ),
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

  return (
    <DocumentPaginationSurface
      className="public-document-demo-sheet document-pagination-surface document-preview-tiptap-pagination-surface mx-auto"
      editor={editor}
    >
      <EditorContent editor={editor} />
    </DocumentPaginationSurface>
  );
}
