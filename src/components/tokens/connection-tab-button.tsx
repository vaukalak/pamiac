import { Button } from "@/ui/Button";

interface Properties {
  label: string;
  pressed: boolean;
  onSelect: () => void;
}

export function ConnectionTabButton(props: Properties) {
  const { label, pressed, onSelect } = props;

  return (
    <Button className="secondary small" onClick={onSelect} pressed={pressed} type="button">
      {label}
    </Button>
  );
}
