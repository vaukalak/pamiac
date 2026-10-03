"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { ResetPasswordDone } from "@/components/reset-password/reset-password-done";
import { ResetPasswordPrompt } from "@/components/reset-password/reset-password-prompt";
import { authClient } from "@/lib/auth-client";
import { loginSendFailureSentence } from "@/lib/login-send-failure";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

interface Properties {
  token: string;
}

interface ResetValues {
  password: string;
}

const RESET_FAILURE = "We could not update the password.";

function resetPasswordMessage(password: string) {
  if (password.trim() === "") return "Enter a password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 128) return "Use at most 128 characters.";
  return "";
}

const resetResolver: Resolver<ResetValues> = (values) => {
  const password = resetPasswordMessage(values.password);
  if (!password) return { values, errors: {} };
  const errors: FieldErrors<ResetValues> = {
    password: { type: "validate", message: password },
  };
  return { values: {}, errors };
};

async function completePasswordReset(input: { password: string; token: string }) {
  const { password, token } = input;
  let result: Awaited<ReturnType<typeof authClient.resetPassword>>;
  try {
    result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
  } catch (error) {
    throw new Error(
      loginSendFailureSentence(error instanceof Error ? error.message : undefined, RESET_FAILURE),
    );
  }
  if (result.error) {
    throw new Error(loginSendFailureSentence(result.error.message, RESET_FAILURE));
  }
}

export function ResetPasswordForm(props: Properties) {
  const { token } = props;
  const form = useForm<ResetValues>({
    defaultValues: { password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: resetResolver,
  });
  const mutation = useMutation({
    mutationFn: (values: ResetValues) =>
      completePasswordReset({ password: values.password, token }),
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  if (mutation.isSuccess) return <ResetPasswordDone />;

  return (
    <Form.Context
      className="form-stack"
      form={form}
      onSubmit={(values) => {
        mutation.mutate(values);
      }}
    >
      <ResetPasswordPrompt />
      <Form.Input
        autoComplete="new-password"
        label="New password"
        name="password"
        type="password"
      />
      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Saving…" : "Set password"}
      </Button>
      {mutation.isError ? <Alert>{message}</Alert> : null}
    </Form.Context>
  );
}
