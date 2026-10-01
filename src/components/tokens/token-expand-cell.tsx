import { Button } from "@/ui/Button";

interface Properties {
  expanded: boolean;
  onToggle: () => void;
}

export function TokenExpandCell(props: Properties) {
  const { expanded, onToggle } = props;

  return (
    <td>
      <Button className="ghost small" expanded={expanded} onClick={onToggle} type="button">
        {expanded ? "Hide" : "Expand"}
      </Button>
    </td>
  );
}
