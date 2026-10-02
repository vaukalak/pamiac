import { PrivateSignIn } from "@/components/document/private-sign-in";
import { RequestPermissions } from "@/components/document/request-permissions";
import { Page } from "@/ui/Page";

interface Properties {
  id: string;
  signedIn: boolean;
  type: "note" | "diagram";
}

export function PrivateDocument(props: Properties) {
  const { id, signedIn, type } = props;

  return (
    <Page className="library-main">
      {signedIn ? <RequestPermissions id={id} /> : <PrivateSignIn id={id} type={type} />}
    </Page>
  );
}
