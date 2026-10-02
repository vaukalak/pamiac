import { Button } from "@/ui/Button";

interface Properties {
  current: boolean;
  name: string;
  onOpen: () => void;
}

export function LibraryFolderCrumb(props: Properties) {
  const { current, name, onOpen } = props;

  if (current) return <span className="library-folder-current">{name}</span>;

  return (
    <Button className="ghost small" onClick={onOpen} type="button">
      {name}
    </Button>
  );
}
