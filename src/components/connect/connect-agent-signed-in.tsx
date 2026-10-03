import { ConnectChooser } from "@/components/connect/connect-chooser";
import { PageTitle } from "@/ui/PageTitle";

export function ConnectAgentSignedIn() {
  return (
    <>
      <PageTitle
        subtitle="Use your Pamiac notes and diagrams from your favorite AI."
        title="Connect Pamiac"
      />
      <ConnectChooser embedded />
    </>
  );
}
