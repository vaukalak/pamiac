interface Properties {
  value: string;
  label: string;
}

export function FormSelectOption(props: Properties) {
  const { value, label } = props;

  return <option value={value}>{label}</option>;
}
