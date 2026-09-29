interface Properties {
  editable: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

export function CompartmentField(props: Properties) {
  const { editable, id, label, onChange, value } = props;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <textarea
        disabled={!editable}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </div>
  );
}
