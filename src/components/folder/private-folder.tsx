import { PrivateFolderDenied } from "@/components/folder/private-folder-denied";
import { PrivateFolderSignIn } from "@/components/folder/private-folder-sign-in";
import { Page } from "@/ui/Page";

interface Properties {
  id: string;
  signedIn: boolean;
}

export function PrivateFolder(props: Properties) {
  const { id, signedIn } = props;

  return (
    <Page className="library-main">
      {signedIn ? <PrivateFolderDenied /> : <PrivateFolderSignIn id={id} />}
    </Page>
  );
}
