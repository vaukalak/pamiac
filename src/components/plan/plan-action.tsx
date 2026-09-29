interface Properties {
  enabled: boolean;
  label: string;
}

export function PlanAction(props: Properties) {
  const { enabled, label } = props;
  const className = enabled ? "btn" : "btn secondary";

  return (
    <button
      aria-current={enabled ? "true" : undefined}
      className={className}
      disabled={!enabled}
      type="button"
    >
      {label}
    </button>
  );
}
