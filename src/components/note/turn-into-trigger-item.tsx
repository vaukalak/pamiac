import { useComponentsContext } from "@blocknote/react";

interface Properties {
  label: string;
}

export function TurnIntoTriggerItem(props: Properties) {
  const { label } = props;
  const Components = useComponentsContext();

  if (!Components) return null;

  return (
    <Components.Generic.Menu.Item className="bn-menu-item" subTrigger={true}>
      {label}
    </Components.Generic.Menu.Item>
  );
}
