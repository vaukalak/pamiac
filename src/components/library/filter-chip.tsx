interface Properties {
  label: string;
  pressed: boolean;
  onSelect: () => void;
}

export function FilterChip(props: Properties) {
  const { label, pressed, onSelect } = props;

  return (
    <button aria-pressed={pressed} onClick={onSelect} type="button">
      {label}
    </button>
  );
}
