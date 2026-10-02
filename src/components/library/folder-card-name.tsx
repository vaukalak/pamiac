import { Button } from "@/ui/Button";

interface Properties {
  name: string;
  onOpen: () => void;
}

export function FolderCardName(props: Properties) {
  const { name, onOpen } = props;

  return (
    <h2>
      <Button className="folder-open" onClick={onOpen} type="button">
        {name}
      </Button>
    </h2>
  );
}
