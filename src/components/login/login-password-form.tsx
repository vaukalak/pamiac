"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { LoginSendFailure } from "@/components/login/login-send-failure";
import { authClient } from "@/lib/auth-client";
import { loginSendFailureSentence } from "@/lib/login-send-failure";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

interface Properties {
  nextPath: string;
}

interface PasswordValues {
  email: string;
  password: string;
}

const PASSWORD_FAILURE = "That email or password did not match.";

function passwordEmailMessage(email: string) {
  if (email.includes("@")) return "";
  if (email.trim() === "") return "Enter an email address.";
  return "That address needs an @.";
}

function passwordFieldMessage(password: string) {
  if (password.trim() === "") return "Enter a password.";
  return "";
}

const passwordResolver: Resolver<PasswordValues> = (values) => {
  const email = passwordEmailMessage(values.email);
  const password = passwordFieldMessage(values.password);
  if (!email && !password) return { values, errors: {} };
  const errors: FieldErrors<PasswordValues> = {};
  if (email) errors.email = { type: "validate", message: email };
  if (password) errors.password = { type: "validate", message: password };
  return { values: {}, errors };
};

async function signInWithPassword(input: { email: string; password: string; nextPath: string }) {
  const { email, password, nextPath } = input;
  let result: Awaited<ReturnType<typeof authClient.signIn.email>>;
  try {
    result = await authClient.signIn.email({
      email,
      password,
      callbackURL: nextPath,
    });
  } catch (error) {
    throw new Error(
      loginSendFailureSentence(
        error instanceof Error ? error.message : undefined,
        PASSWORD_FAILURE,
      ),
    );
  }
  if (result.error) {
    throw new Error(loginSendFailureSentence(result.error.message, PASSWORD_FAILURE));
  }
}

export function LoginPasswordForm(props: Properties) {
  const { nextPath } = props;
  const form = useForm<PasswordValues>({
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: passwordResolver,
  });
  const mutation = useMutation({
    mutationFn: (values: PasswordValues) => signInWithPassword({ ...values, nextPath }),
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <Form.Context
      className="form-stack"
      form={form}
      onSubmit={(values) => {
        mutation.mutate(values);
      }}
    >
      <Form.Input
        autoComplete="email"
        id="login-password-email"
        label="Email"
        name="email"
        type="email"
      />
      <Form.Input
        autoComplete="current-password"
        id="login-password-password"
        label="Password"
        name="password"
        type="password"
      />
      <Button disabled={mutation.isPending} type="submit">
        Submit
      </Button>
      {mutation.isError ? <LoginSendFailure happened={message} /> : null}
    </Form.Context>
  );
}
