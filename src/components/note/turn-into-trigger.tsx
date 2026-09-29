import { useComponentsContext } from "@blocknote/react";
import { TurnIntoTriggerItem } from "@/components/note/turn-into-trigger-item";

interface Properties {
  label: string;
}

export function TurnIntoTrigger(props: Properties) {
  const { label } = props;
  const Components = useComponentsContext();

  if (!Components) return null;

  return (
    <Components.Generic.Menu.Trigger sub={true}>
      <TurnIntoTriggerItem label={label} />
    </Components.Generic.Menu.Trigger>
  );
}
