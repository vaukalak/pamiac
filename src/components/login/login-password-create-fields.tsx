import { Form } from "@/ui/Form";

export function LoginPasswordCreateFields() {
  return (
    <>
      <Form.Input
        autoComplete="new-password"
        id="login-password-password"
        label="Password"
        name="password"
        type="password"
      />
      <Form.Input
        autoComplete="new-password"
        id="login-password-confirm"
        label="Confirm password"
        name="confirmPassword"
        type="password"
      />
    </>
  );
}
