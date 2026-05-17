import { type Editor, Extension, Mark } from "@tiptap/core";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

export type SelectionRange = { from: number; to: number };

export const AISuggestionMark = Mark.create({
  name: "aiSuggestion",
  addAttributes() {
    return {
      kind: {
        default: "inserted",
        parseHTML: (element) => element.getAttribute("data-ai-suggestion-kind"),
        renderHTML: (attributes) => ({
          "data-ai-suggestion-kind": attributes.kind,
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-ai-suggestion-kind]" }];
  },
  renderHTML({ mark }) {
    const kind = mark.attrs.kind === "deleted" ? "deleted" : "inserted";

    return [
      "span",
      {
        "data-ai-suggestion-kind": kind,
        class: kind === "deleted" ? "ai-suggestion-deleted" : "ai-suggestion-inserted",
      },
      0,
    ];
  },
});

export const AISelectionHighlightMark = Mark.create({
  name: "aiSelectionHighlight",
  parseHTML() {
    return [{ tag: "span[data-ai-selection-highlight]" }];
  },
  renderHTML() {
    return [
      "span",
      {
        "data-ai-selection-highlight": "true",
        class: "ai-selection-highlight",
      },
      0,
    ];
  },
});

export const ParagraphIndentExtension = Extension.create({
  name: "paragraphIndent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          indentLevel: {
            default: 0,
            parseHTML: (element) => Number(element.getAttribute("data-indent-level") ?? 0),
            renderHTML: (attributes) => {
              const indentLevel = Number(attributes.indentLevel ?? 0);

              if (indentLevel <= 0) {
                return {};
              }

              return {
                "data-indent-level": String(indentLevel),
              };
            },
          },
          noFirstLineIndent: {
            default: false,
            parseHTML: (element) => element.getAttribute("data-no-first-line-indent") === "true",
            renderHTML: (attributes) => {
              if (!attributes.noFirstLineIndent) {
                return {};
              }

              return {
                "data-no-first-line-indent": "true",
              };
            },
          },
        },
      },
    ];
  },
});

function updateSelectedParagraphIndent(editor: Editor, direction: 1 | -1) {
  const { doc, selection, tr } = editor.state;
  let transaction = tr;
  let from = selection.from;
  let to = selection.to;
  let changed = false;

  if (selection.empty) {
    for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
      if (selection.$from.node(depth).type.name === "paragraph") {
        from = selection.$from.before(depth);
        to = selection.$from.after(depth);
        break;
      }
    }
  }

  doc.nodesBetween(from, to, (node, position) => {
    if (node.type.name !== "paragraph") {
      return;
    }

    const currentIndent = Number(node.attrs.indentLevel ?? 0);
    const noFirstLineIndent = Boolean(node.attrs.noFirstLineIndent);
    let nextIndent = currentIndent;
    let nextNoFirstLineIndent = noFirstLineIndent;

    if (direction > 0) {
      if (noFirstLineIndent && currentIndent === 0) {
        nextNoFirstLineIndent = false;
      } else {
        nextIndent = Math.min(6, currentIndent + 1);
        nextNoFirstLineIndent = false;
      }
    } else if (currentIndent > 0) {
      nextIndent = currentIndent - 1;
      nextNoFirstLineIndent = false;
    } else if (!noFirstLineIndent) {
      nextNoFirstLineIndent = true;
    }

    if (nextIndent === currentIndent && nextNoFirstLineIndent === noFirstLineIndent) {
      return;
    }

    transaction = transaction.setNodeMarkup(position, undefined, {
      ...node.attrs,
      indentLevel: nextIndent,
      noFirstLineIndent: nextNoFirstLineIndent,
    });
    changed = true;
  });

  if (!changed) {
    return false;
  }

  editor.view.dispatch(transaction.scrollIntoView());
  return true;
}

function selectionIsInsideNode(editor: Editor, nodeName: string) {
  for (let depth = editor.state.selection.$from.depth; depth > 0; depth -= 1) {
    if (editor.state.selection.$from.node(depth).type.name === nodeName) {
      return true;
    }
  }

  return false;
}

export function handleEditorTab(editor: Editor, direction: 1 | -1) {
  if (direction > 0 && selectionIsInsideNode(editor, "listItem")) {
    return editor.chain().focus().sinkListItem("listItem").run();
  }

  if (direction < 0 && selectionIsInsideNode(editor, "listItem")) {
    return editor.chain().focus().liftListItem("listItem").run();
  }

  return updateSelectedParagraphIndent(editor, direction) || true;
}

function removeParagraphIndentAtCursor(editor: Editor) {
  const { selection, tr } = editor.state;

  if (!selection.empty || selectionIsInsideNode(editor, "listItem")) {
    return false;
  }

  for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
    const node = selection.$from.node(depth);

    if (node.type.name !== "paragraph") {
      continue;
    }

    const paragraphPosition = selection.$from.before(depth);
    const paragraphContentStart = paragraphPosition + 1;

    if (selection.from !== paragraphContentStart) {
      return false;
    }

    const currentIndent = Number(node.attrs.indentLevel ?? 0);
    const noFirstLineIndent = Boolean(node.attrs.noFirstLineIndent);

    if (currentIndent <= 0 && noFirstLineIndent) {
      return false;
    }

    editor.view.dispatch(
      tr
        .setNodeMarkup(paragraphPosition, undefined, {
          ...node.attrs,
          indentLevel: Math.max(0, currentIndent - 1),
          noFirstLineIndent: currentIndent <= 0,
        })
        .scrollIntoView(),
    );
    return true;
  }

  return false;
}

export const DocumentKeyboardShortcuts = Extension.create({
  name: "documentKeyboardShortcuts",
  addKeyboardShortcuts() {
    return {
      Backspace: () => removeParagraphIndentAtCursor(this.editor),
      Tab: () => handleEditorTab(this.editor, 1),
      "Shift-Tab": () => handleEditorTab(this.editor, -1),
    };
  },
});

export function clearAISelectionHighlight(editor: Editor) {
  const markType = editor.schema.marks.aiSelectionHighlight;

  if (!markType) {
    return;
  }

  let transaction = editor.state.tr;

  editor.state.doc.descendants((node, position) => {
    if (!node.isText || !markType.isInSet(node.marks)) {
      return;
    }

    transaction = transaction.removeMark(position, position + node.nodeSize, markType);
  });

  if (transaction.docChanged) {
    editor.view.dispatch(transaction);
  }
}

export function applyAISelectionHighlight(editor: Editor, range: SelectionRange) {
  const markType = editor.schema.marks.aiSelectionHighlight;

  if (!markType || range.from >= range.to) {
    return;
  }

  clearAISelectionHighlight(editor);

  const transaction = editor.state.tr.addMark(range.from, range.to, markType.create());
  editor.view.dispatch(transaction);
}

export function getDocumentTiptapExtensions({
  includeBubbleMenu = false,
  includeKeyboardShortcuts = false,
  includePlaceholder = false,
}: {
  includeBubbleMenu?: boolean;
  includeKeyboardShortcuts?: boolean;
  includePlaceholder?: boolean;
} = {}) {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: false,
      underline: false,
    }),
    includeBubbleMenu ? BubbleMenu.configure({ element: null }) : null,
    includeKeyboardShortcuts ? DocumentKeyboardShortcuts : null,
    AISuggestionMark,
    AISelectionHighlightMark,
    ParagraphIndentExtension,
    Link.configure({
      openOnClick: false,
    }),
    Highlight.configure({
      multicolor: false,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Underline,
    includePlaceholder
      ? Placeholder.configure({
          placeholder: "Comece a escrever...",
        })
      : null,
  ].filter((extension): extension is NonNullable<typeof extension> => extension !== null);
}
