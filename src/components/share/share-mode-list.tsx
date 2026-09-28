import type { Visibility } from "@/lib/access";
import { ShareModeOption } from "@/components/share/share-mode-option";

interface Properties {
  mode: Visibility;
  onChange: (mode: Visibility) => void;
}

const MODES = [
  { value: "private", title: "Only me", detail: "Only you can open it." },
  {
    value: "emails",
    title: "By email",
    detail: "Invited people sign in with that email to view.",
  },
  {
    value: "password",
    title: "By password",
    detail: "Anyone with the link and the password can view.",
  },
  { value: "public", title: "Public", detail: "Anyone with the link can view." },
] as const;

export function ShareModeList(props: Properties) {
  const { mode, onChange } = props;

  return (
    <fieldset className="share-modes">
      <legend className="hint">Who can open this document</legend>
      {MODES.map((item) => (
        <ShareModeOption
          checked={mode === item.value}
          detail={item.detail}
          key={item.value}
          onSelect={() => onChange(item.value)}
          title={item.title}
          value={item.value}
        />
      ))}
    </fieldset>
  );
}
