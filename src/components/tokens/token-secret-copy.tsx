import { Button } from "@/ui/Button";

interface Properties {
  secret: string;
  onResult: (message: string) => void;
}

export function TokenSecretCopy(props: Properties) {
  const { secret, onResult } = props;

  async function copy() {
    onResult("");
    try {
      await navigator.clipboard.writeText(secret);
      onResult("Key copied.");
    } catch {
      onResult("Could not copy the key.");
    }
  }

  return (
    <Button className="secret-icon" onClick={() => void copy()} type="button">
      <span className="login-announcement">Copy API key</span>
      <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height="16"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 16 16"
        width="16"
      >
        <rect height="9" rx="1.5" width="9" x="1.75" y="1.75" />
        <rect height="9" rx="1.5" width="9" x="5.25" y="5.25" />
      </svg>
    </Button>
  );
}
