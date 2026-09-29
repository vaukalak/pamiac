import { editorHasBlockWithType } from "@blocknote/core";
import { SideMenuExtension } from "@blocknote/core/extensions";
import {
  blockTypeSelectItems,
  useBlockNoteEditor,
  useComponentsContext,
  useExtensionState,
  usePortalElement,
} from "@blocknote/react";
import { useMemo } from "react";
import { TurnIntoList } from "@/components/note/turn-into-list";
import { TurnIntoTrigger } from "@/components/note/turn-into-trigger";
import { blockMatchesAnyChoice } from "@/lib/turn-into";

interface Properties {
  label: string;
}

function propTypes(props: Record<string, boolean | number | string> | undefined) {
  return Object.fromEntries(
    Object.entries(props ?? {}).map(([name, value]) => [name, typeof value]),
  ) as Record<string, "string" | "number" | "boolean">;
}

export function TurnIntoMenu(props: Properties) {
  const { label } = props;
  const Components = useComponentsContext();
  const portalElement = usePortalElement();
  const editor = useBlockNoteEditor();
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });
  const choices = useMemo(
    () =>
      blockTypeSelectItems(editor.dictionary).filter((item) =>
        editorHasBlockWithType(editor, item.type, propTypes(item.props)),
      ),
    [editor],
  );
  const visible = block !== undefined && blockMatchesAnyChoice(block, choices);

  if (!Components || !visible) return null;

  return (
    <Components.Generic.Menu.Root position="right" portalElement={portalElement} sub={true}>
      <TurnIntoTrigger label={label} />
      <TurnIntoList choices={choices} />
    </Components.Generic.Menu.Root>
  );
}
