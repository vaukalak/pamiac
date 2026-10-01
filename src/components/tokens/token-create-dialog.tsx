import { TokenCreateForm } from "@/components/tokens/token-create-form";
import { TokenFormDialog } from "@/components/tokens/token-form-dialog";

interface Properties {
  onClose: () => void;
}

export function TokenCreateDialog(props: Properties) {
  const { onClose } = props;

  return (
    <TokenFormDialog onClose={onClose} title="Create API key">
      <TokenCreateForm />
    </TokenFormDialog>
  );
}
