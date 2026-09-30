import { Button } from "@/ui/Button";

interface Properties {
  count: number;
  label: string;
  pressed: boolean;
  onSelect: () => void;
}

export function FilterChip(props: Properties) {
  const { count, label, pressed, onSelect } = props;

  return (
    <Button className="filter-chip" onClick={onSelect} pressed={pressed} type="button">
      <span>{label}</span>
      <span className="filter-count">{count}</span>
    </Button>
  );
}
