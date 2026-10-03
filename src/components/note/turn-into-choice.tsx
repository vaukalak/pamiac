import { SideMenuExtension } from "@blocknote/core/extensions";
import {
  useBlockNoteEditor,
  useComponentsContext,
  useExtensionState,
  type BlockTypeSelectItem,
} from "@blocknote/react";
import { NARROW_NOTE_QUERY } from "@/lib/note-narrow";
import { blockMatchesChoice, blocksToTurnInto, type TurnIntoChoice } from "@/lib/turn-into";

interface Properties {
  choice: BlockTypeSelectItem;
  choices: readonly TurnIntoChoice[];
}

export function TurnIntoChoice(props: Properties) {
  const { choice, choices } = props;
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });
  const Icon = choice.icon;
  const checked = block !== undefined && blockMatchesChoice(block, choice);

  if (!Components) return null;

  return (
    <Components.Generic.Menu.Item
      checked={checked}
      className="bn-menu-item"
      icon={<Icon size={16} />}
      onClick={() => {
        if (block === undefined) return;

        if (!window.matchMedia(NARROW_NOTE_QUERY).matches) editor.focus();
        const selected = editor.getSelection()?.blocks;
        editor.transact(() => {
          for (const target of blocksToTurnInto(block, selected, choices)) {
            editor.updateBlock(target, {
              type: choice.type,
              props: choice.props,
            } as Parameters<typeof editor.updateBlock>[1]);
          }
        });
      }}
    >
      {choice.name}
    </Components.Generic.Menu.Item>
  );
}
