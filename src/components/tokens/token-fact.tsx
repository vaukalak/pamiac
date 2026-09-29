interface Properties {
  label: string;
  value: string;
}

export function TokenFact(props: Properties) {
  const { label, value } = props;

  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
