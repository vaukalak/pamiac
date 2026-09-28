interface Properties {
  value: string;
  onChange: (value: string) => void;
}

export function ShareEmailsField(props: Properties) {
  const { value, onChange } = props;

  return (
    <div>
      <label htmlFor="share-emails">Emails</label>
      <textarea
        id="share-emails"
        onChange={(event) => onChange(event.target.value)}
        placeholder={"ada@example.com\ngrace@example.com"}
        value={value}
      />
    </div>
  );
}
