import type { Visibility } from "@/lib/access";
import { ShareModeCopy } from "@/components/share/share-mode-copy";

interface Properties {
  checked: boolean;
  detail: string;
  title: string;
  value: Visibility;
  onSelect: () => void;
}

export function ShareModeOption(props: Properties) {
  const { checked, detail, title, value, onSelect } = props;

  return (
    <label className="choice">
      <input checked={checked} name="share" onChange={onSelect} type="radio" value={value} />
      <ShareModeCopy detail={detail} title={title} />
    </label>
  );
}
