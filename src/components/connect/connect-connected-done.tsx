import { Button } from "@/ui/Button";

interface Properties {
  onClose: () => void;
}

export function ConnectConnectedDone(props: Properties) {
  const { onClose } = props;

  return (
    <Button className="library-lime" onClick={onClose} type="button">
      Done
    </Button>
  );
}
