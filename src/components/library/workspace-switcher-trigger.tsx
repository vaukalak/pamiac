import { WorkspaceSwitcherChevron } from "@/components/library/workspace-switcher-chevron";
import { Button } from "@/ui/Button";

interface Properties {
  controls: string;
  label: string;
  open: boolean;
  onToggle: () => void;
}

export function WorkspaceSwitcherTrigger(props: Properties) {
  const { controls, label, onToggle, open } = props;

  return (
    <Button
      className="workspace-switcher-trigger"
      controls={controls}
      expanded={open}
      onClick={onToggle}
      popup="listbox"
      type="button"
    >
      <span className="workspace-switcher-name">{label}</span>
      <WorkspaceSwitcherChevron />
    </Button>
  );
}
