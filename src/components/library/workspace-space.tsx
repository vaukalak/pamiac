import { spaceInitial } from "@/lib/library-spaces";

interface Properties {
  label: string;
  onSelect: () => void;
  pressed: boolean;
}

export function WorkspaceSpace(props: Properties) {
  const { label, onSelect, pressed } = props;

  return (
    <button
      aria-label={label}
      aria-pressed={pressed}
      className="workspace-space"
      onClick={onSelect}
      title={label}
      type="button"
    >
      <span aria-hidden="true">{spaceInitial(label)}</span>
      <span className="workspace-space-tip">{label}</span>
    </button>
  );
}
