import { Button } from "@/ui/Button";

interface Properties {
  current: boolean;
  label: string;
  onSelect: () => void;
}

export function WorkspaceSwitcherOption(props: Properties) {
  const { current, label, onSelect } = props;

  return (
    <Button
      className="workspace-switcher-option"
      onClick={onSelect}
      role="option"
      selected={current}
      type="button"
    >
      <span className="workspace-switcher-name">{label}</span>
      {current ? (
        <span aria-hidden="true" className="workspace-switcher-check">
          ✓
        </span>
      ) : null}
    </Button>
  );
}
