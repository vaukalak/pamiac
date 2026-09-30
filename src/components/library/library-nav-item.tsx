import { Button } from "@/ui/Button";

interface Properties {
  label: string;
  pressed: boolean;
  onSelect: () => void;
}

export function LibraryNavItem(props: Properties) {
  const { label, pressed, onSelect } = props;

  return (
    <Button className="library-nav-item" onClick={onSelect} pressed={pressed} type="button">
      {label}
    </Button>
  );
}
