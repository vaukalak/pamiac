import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  label: string;
  description: string;
  selected: boolean;
  controls: string;
  tabId: string;
  onSelect: () => void;
}

export function HomeFeatureTab(props: Properties) {
  const { label, description, selected, controls, tabId, onSelect } = props;

  return (
    <button
      aria-controls={controls}
      aria-selected={selected}
      className="hero-tab"
      id={tabId}
      onClick={onSelect}
      role="tab"
      tabIndex={selected ? 0 : -1}
      type="button"
    >
      <span className="hero-tab-label">{label}</span>
      <Paragraph>{description}</Paragraph>
    </button>
  );
}
