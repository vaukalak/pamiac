import { RequestEditButton } from "@/components/document/request-edit-button";
import { RequestEditLogin } from "@/components/document/request-edit-login";

interface Properties {
  canEdit: boolean;
  id: string;
  signedIn: boolean;
}

export function RequestEdit(props: Properties) {
  const { canEdit, id, signedIn } = props;
  if (canEdit) return null;

  return signedIn ? <RequestEditButton id={id} /> : <RequestEditLogin id={id} />;
}
