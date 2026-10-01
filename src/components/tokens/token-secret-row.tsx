import { TokenSecretCopy } from "@/components/tokens/token-secret-copy";
import { maskTokenSecret } from "@/components/tokens/token-secret-mask";
import { TokenSecretReveal } from "@/components/tokens/token-secret-reveal";

interface Properties {
  secret: string;
  visible: boolean;
  onResult: (message: string) => void;
  onToggle: () => void;
}

export function TokenSecretRow(props: Properties) {
  const { secret, visible, onResult, onToggle } = props;
  const shown = visible ? secret : maskTokenSecret(secret);

  return (
    <div className="secret">
      <span className="secret-value">{shown}</span>
      <TokenSecretCopy onResult={onResult} secret={secret} />
      <TokenSecretReveal onToggle={onToggle} visible={visible} />
    </div>
  );
}
