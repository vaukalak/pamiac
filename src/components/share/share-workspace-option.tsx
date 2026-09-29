import { ShareModeCopy } from "@/components/share/share-mode-copy";

interface Properties {
  checked: boolean;
  detail: string;
  title: string;
  value: string;
  onSelect: () => void;
}

export function ShareWorkspaceOption(props: Properties) {
  const { checked, detail, title, value, onSelect } = props;

  return (
    <label className="choice">
      <input
        checked={checked}
        name="share-workspace"
        onChange={onSelect}
        type="radio"
        value={value}
      />
      <ShareModeCopy detail={detail} title={title} />
    </label>
  );
}
