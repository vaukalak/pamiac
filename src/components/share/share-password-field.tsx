interface Properties {
  hasPassword: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function SharePasswordField(props: Properties) {
  const { hasPassword, value, onChange } = props;

  return (
    <div>
      <label htmlFor="share-password">{hasPassword ? "New password" : "Password"}</label>
      <input
        id="share-password"
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          hasPassword ? "Leave blank to keep the current password" : "At least 4 characters"
        }
        type="password"
        value={value}
      />
    </div>
  );
}
