import type { BlockNoteEditor } from "@blocknote/core";
import { markdownPasteText } from "@/lib/markdown-paste";

interface PasteContext {
  event: ClipboardEvent;
  editor: BlockNoteEditor<any, any, any>;
  defaultPasteHandler: (context?: {
    prioritizeMarkdownOverHTML?: boolean;
    plainTextAsMarkdown?: boolean;
  }) => boolean | undefined;
}

function selectionIsInCodeBlock(editor: BlockNoteEditor<any, any, any>) {
  return editor.transact(
    (transaction) =>
      Boolean(transaction.selection.$from.parent.type.spec.code) &&
      Boolean(transaction.selection.$to.parent.type.spec.code),
  );
}

export function pasteNoteMarkdown(context: PasteContext) {
  const data = context.event.clipboardData;
  const text = markdownPasteText({
    inCodeBlock: selectionIsInCodeBlock(context.editor),
    clipboard: {
      types: data ? Array.from(data.types) : [],
      get: (type) => data?.getData(type) ?? "",
    },
  });

  if (text === undefined) return context.defaultPasteHandler();
  context.editor.pasteMarkdown(text);
  return true;
}
