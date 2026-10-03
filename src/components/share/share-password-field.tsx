import { Form } from "@/ui/Form";

interface Properties {
  hasPassword: boolean;
}

export function SharePasswordField(props: Properties) {
  const { hasPassword } = props;

  return (
    <div className="share-credential">
      <Form.Input
        autoComplete="off"
        label={hasPassword ? "New password" : "Password"}
        name="password"
        placeholder={
          hasPassword ? "Leave blank to keep the current password" : "At least 4 characters"
        }
        type="password"
      />
    </div>
  );
}
