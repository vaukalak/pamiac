import { Button } from "@/ui/Button";

interface Properties {
  visible: boolean;
  onToggle: () => void;
}

export function TokenSecretReveal(props: Properties) {
  const { visible, onToggle } = props;

  return (
    <Button className="secret-icon" onClick={onToggle} pressed={visible} type="button">
      <span className="login-announcement">{visible ? "Hide API key" : "Reveal API key"}</span>
      <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height="16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 16 16"
        width="16"
      >
        <path d="M1.5 8C3.2 5.2 5.4 3.75 8 3.75s4.8 1.45 6.5 4.25c-1.7 2.8-3.9 4.25-6.5 4.25S3.2 10.8 1.5 8Z" />
        <circle cx="8" cy="8" r="1.6" />
        {visible ? <path d="M2.5 2.5 13.5 13.5" /> : null}
      </svg>
    </Button>
  );
}
