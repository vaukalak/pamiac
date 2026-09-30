import { Button } from "@/ui/Button";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  address: string;
  devUrl: string | null;
  onChooseDifferentEmail: () => void;
}

export function LoginLinkSent(props: Properties) {
  const { address, devUrl, onChooseDifferentEmail } = props;

  return (
    <div className="form-stack login-sent">
      <PageTitle title="Check your email" />
      <Paragraph className="hint">
        We sent a link to {address}.
        <br />
        Check your inbox, then spam, then promotions,
        <br />
        and it can take a minute.
      </Paragraph>
      {devUrl ? (
        <a className="dev-link" href={devUrl}>
          Development only: open the link
        </a>
      ) : null}
      <Button className="ghost" onClick={onChooseDifferentEmail} type="button">
        Use a different email
      </Button>
    </div>
  );
}
