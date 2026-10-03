"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { LoginPasswordCreateFields } from "@/components/login/login-password-create-fields";
import { LoginSendFailure } from "@/components/login/login-send-failure";
import { authClient } from "@/lib/auth-client";
import { loginSendFailureSentence } from "@/lib/login-send-failure";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

interface Properties {
  nextPath: string;
  onBack: () => void;
}

interface PasswordValues {
  email: string;
  password: string;
  confirmPassword: string;
}

type PasswordMode = "sign-in" | "create";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const SIGN_IN_FAILURE = "That email or password did not match.";
const CREATE_FAILURE = "The account could not be created.";

function passwordEmailMessage(email: string) {
  if (email.includes("@")) return "";
  if (email.trim() === "") return "Enter an email address.";
  return "That address needs an @.";
}

function signInPasswordMessage(password: string) {
  if (password.trim() === "") return "Enter a password.";
  return "";
}

function createPasswordMessage(password: string) {
  if (password.trim() === "") return "Enter a password.";
  if (password.length < MIN_PASSWORD_LENGTH) return "Use at least 8 characters.";
  if (password.length > MAX_PASSWORD_LENGTH) return "Use at most 128 characters.";
  return "";
}

function confirmPasswordMessage(password: string, confirmPassword: string) {
  if (confirmPassword.trim() === "") return "Confirm your password.";
  if (confirmPassword !== password) return "Those passwords do not match.";
  return "";
}

function accountName(email: string) {
  const local = email.split("@")[0]?.trim() ?? "";
  if (local !== "") return local;
  return "User";
}

function resolvePassword(values: PasswordValues, mode: PasswordMode) {
  const email = passwordEmailMessage(values.email);
  const password =
    mode === "create"
      ? createPasswordMessage(values.password)
      : signInPasswordMessage(values.password);
  const confirmPassword =
    mode === "create" ? confirmPasswordMessage(values.password, values.confirmPassword) : "";
  if (!email && !password && !confirmPassword) return { values, errors: {} };
  const errors: FieldErrors<PasswordValues> = {};
  if (email) errors.email = { type: "validate", message: email };
  if (password) errors.password = { type: "validate", message: password };
  if (confirmPassword) {
    errors.confirmPassword = { type: "validate", message: confirmPassword };
  }
  return { values: {}, errors };
}

function passwordResolver(modeRef: { current: PasswordMode }): Resolver<PasswordValues> {
  return (values) => resolvePassword(values, modeRef.current);
}

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
      loginSendFailureSentence(error instanceof Error ? error.message : undefined, SIGN_IN_FAILURE),
    );
  }
  if (result.error) {
    throw new Error(loginSendFailureSentence(result.error.message, SIGN_IN_FAILURE));
  }
}

async function registerWithPassword(input: { email: string; password: string; nextPath: string }) {
  const { email, password, nextPath } = input;
  let result: Awaited<ReturnType<typeof authClient.signUp.email>>;
  try {
    result = await authClient.signUp.email({
      name: accountName(email),
      email,
      password,
      callbackURL: nextPath,
    });
  } catch (error) {
    throw new Error(
      loginSendFailureSentence(error instanceof Error ? error.message : undefined, CREATE_FAILURE),
    );
  }
  if (result.error) {
    throw new Error(loginSendFailureSentence(result.error.message, CREATE_FAILURE));
  }
}

async function submitPassword(input: {
  email: string;
  password: string;
  mode: PasswordMode;
  nextPath: string;
}) {
  const { email, password, mode, nextPath } = input;
  if (mode === "create") {
    await registerWithPassword({ email, password, nextPath });
    return;
  }
  await signInWithPassword({ email, password, nextPath });
}

export function LoginPasswordForm(props: Properties) {
  const { nextPath, onBack } = props;
  const [mode, setMode] = useState<PasswordMode>("sign-in");
  const modeRef = useRef<PasswordMode>("sign-in");
  modeRef.current = mode;
  const resolver = useMemo(() => passwordResolver(modeRef), []);
  const form = useForm<PasswordValues>({
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver,
  });
  const mutation = useMutation({
    mutationFn: (values: PasswordValues) =>
      submitPassword({
        email: values.email,
        password: values.password,
        mode: modeRef.current,
        nextPath,
      }),
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  function switchMode() {
    setMode(mode === "create" ? "sign-in" : "create");
    mutation.reset();
    form.clearErrors();
  }

  return (
    <Form.Context
      className="form-stack"
      form={form}
      onSubmit={(values) => {
        mutation.mutate(values);
      }}
    >
      <Button className="ghost" onClick={onBack} type="button">
        Back
      </Button>
      <Form.Input
        autoComplete="email"
        id="login-password-email"
        label="Email"
        name="email"
        type="email"
      />
      {mode === "create" ? (
        <LoginPasswordCreateFields />
      ) : (
        <Form.Input
          autoComplete="current-password"
          id="login-password-password"
          label="Password"
          name="password"
          type="password"
        />
      )}
      <Button disabled={mutation.isPending} type="submit">
        {mode === "create" ? "Create account" : "Sign in"}
      </Button>
      <Button className="ghost" disabled={mutation.isPending} onClick={switchMode} type="button">
        {mode === "create" ? "Sign in" : "Create account"}
      </Button>
      {mutation.isError ? <LoginSendFailure happened={message} /> : null}
    </Form.Context>
  );
}
