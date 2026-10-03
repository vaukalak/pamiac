import { filenameFromURL } from "@blocknote/core";
import {
  ScreenReaderOnlySubmit,
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
} from "@blocknote/react";
import { type ChangeEvent, useCallback, useState } from "react";

interface Properties {
  blockId: string;
}

export function NoteVideoEmbedTab(props: Properties) {
  const { blockId } = props;
  const Components = useComponentsContext()!;
  const dict = useDictionary();
  const editor = useBlockNoteEditor<any, any, any>();
  const block = editor.getBlock(blockId);
  const [currentURL, setCurrentURL] = useState("");

  const handleURLChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCurrentURL(event.currentTarget.value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!editor.getBlock(blockId)) {
      return;
    }

    editor.updateBlock(blockId, {
      props: {
        name: filenameFromURL(currentURL),
        url: currentURL,
      },
    });
  }, [blockId, currentURL, editor]);

  if (!block) {
    return null;
  }

  return (
    <Components.FilePanel.TabPanel className="bn-tab-panel">
      <Components.Generic.Form.Root
        onSubmit={handleSubmit}
        submitButton={<ScreenReaderOnlySubmit />}
      >
        <Components.FilePanel.TextInput
          className="bn-text-input"
          onChange={handleURLChange}
          placeholder={dict.file_panel.embed.url_placeholder}
          value={currentURL}
        />
      </Components.Generic.Form.Root>
    </Components.FilePanel.TabPanel>
  );
}
