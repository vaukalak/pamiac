"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { supportRequestSchema, type SupportRequest } from "@/lib/support";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

const supportResolver: Resolver<SupportRequest> = (values) => {
  const result = supportRequestSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }

  const errors: FieldErrors<SupportRequest> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if ((key === "email" || key === "message") && !errors[key]) {
      errors[key] = { type: issue.code, message: issue.message };
    }
  }

  return { values: {}, errors };
};

async function postSupportRequest(values: SupportRequest) {
  const response = await fetch("/api/support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "Could not send your message");
  }
}

export function SupportForm() {
  const form = useForm<SupportRequest>({
    defaultValues: { email: "", message: "" },
    resolver: supportResolver,
  });
  const mutation = useMutation({
    mutationFn: postSupportRequest,
  });

  if (mutation.isSuccess) {
    return (
      <div className="form-stack" role="status">
        <Paragraph>Your message is with Pamiac support.</Paragraph>
        <Paragraph>We will reply to this email.</Paragraph>
      </div>
    );
  }

  const error = mutation.error instanceof Error ? mutation.error.message : null;

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
        label="Email"
        name="email"
        placeholder="you@example.com"
        type="email"
      />
      <Form.Textarea label="Message" name="message" placeholder="What should we help with?" />
      {error ? <Alert>{error}</Alert> : null}
      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Sending…" : "Send to support"}
      </Button>
    </Form.Context>
  );
}
