import { LibraryPlusIcon } from "@/components/library/library-plus-icon";

interface Properties {
  expanded: boolean;
  label: string;
  onOpen: () => void;
}

export function LibrarySpaceAddButton(props: Properties) {
  const { expanded, label, onOpen } = props;

  return (
    <button
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-label={label}
      className="library-plus"
      onClick={onOpen}
      type="button"
    >
      <LibraryPlusIcon />
      {label}
    </button>
  );
}
