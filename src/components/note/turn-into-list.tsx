import { useComponentsContext, type BlockTypeSelectItem } from "@blocknote/react";
import { TurnIntoChoice } from "@/components/note/turn-into-choice";

interface Properties {
  choices: readonly BlockTypeSelectItem[];
}

export function TurnIntoList(props: Properties) {
  const { choices } = props;
  const Components = useComponentsContext();

  if (!Components) return null;

  return (
    <Components.Generic.Menu.Dropdown className="bn-menu-dropdown" sub={true}>
      {choices.map((choice) => (
        <TurnIntoChoice
          key={`${choice.type}:${JSON.stringify(choice.props ?? {})}`}
          choice={choice}
          choices={choices}
        />
      ))}
    </Components.Generic.Menu.Dropdown>
  );
}
