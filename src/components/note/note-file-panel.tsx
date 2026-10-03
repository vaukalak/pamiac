import { FilePanel, useBlockNoteEditor, useDictionary } from "@blocknote/react";
import { NoteVideoEmbedTab } from "@/components/note/note-video-embed-tab";

interface Properties {
  blockId: string;
}

export function NoteFilePanel(props: Properties) {
  const { blockId } = props;
  const editor = useBlockNoteEditor<any, any, any>();
  const dict = useDictionary();
  const block = editor.getBlock(blockId);

  if (block?.type !== "video") {
    return <FilePanel blockId={blockId} />;
  }

  return (
    <FilePanel
      blockId={blockId}
      tabs={[
        {
          name: dict.file_panel.embed.title,
          tabPanel: <NoteVideoEmbedTab blockId={blockId} />,
        },
      ]}
    />
  );
}
