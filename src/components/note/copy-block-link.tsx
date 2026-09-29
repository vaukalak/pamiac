import { SideMenuExtension } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useComponentsContext, useExtensionState } from "@blocknote/react";
import { publishNoteMarkdown } from "@/components/note/note-markdown-publisher";
import { blockPermalink, copyToClipboard } from "@/lib/block-link";

interface Properties {
  label: string;
}

export function CopyBlockLink(props: Properties) {
  const { label } = props;
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  if (!Components) return null;

  return (
    <Components.Generic.Menu.Item
      className="bn-menu-item"
      onClick={() => {
        if (block === undefined) return;

        const link = blockPermalink(window.location.href, block.id);
        void copyToClipboard((value) => navigator.clipboard.writeText(value), link);
        publishNoteMarkdown(editor);
      }}
    >
      {label}
    </Components.Generic.Menu.Item>
  );
}
