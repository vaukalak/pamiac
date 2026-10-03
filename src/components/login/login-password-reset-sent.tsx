import { Button } from "@/ui/Button";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  address: string;
  onBack: () => void;
}

export function LoginPasswordResetSent(props: Properties) {
  const { address, onBack } = props;

  return (
    <div className="form-stack login-sent">
      <PageTitle title="Check your email" />
      <Paragraph className="hint">
        If an account uses {address}, we email a reset link.
        <br />
        Check your inbox, then spam, then promotions,
        <br />
        and it can take a minute.
      </Paragraph>
      <Button className="ghost" onClick={onBack} type="button">
        Back
      </Button>
    </div>
  );
}
