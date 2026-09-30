"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  id: string;
}

interface UnlockValues {
  password: string;
}

async function unlockDocument(id: string, password: string) {
  if (!password.trim()) throw new Error("Enter the password.");
  const response = await fetch(`/api/documents/${id}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) throw new Error("That password does not open this document.");
}

export function LockedPassword(props: Properties) {
  const { id } = props;
  const router = useRouter();
  const form = useForm<UnlockValues>({
    defaultValues: { password: "" },
  });
  const unlock = useMutation({
    mutationFn: (password: string) => unlockDocument(id, password),
    onSuccess: () => {
      router.refresh();
    },
  });

  function submit(values: UnlockValues) {
    unlock.mutate(values.password);
  }

  const message = unlock.error instanceof Error ? unlock.error.message : "";

  return (
    <Section className="document-gate">
      <PageTitle title="Password required" />
      <Paragraph>The owner protected this note or diagram with a password.</Paragraph>
      <Form.Context className="form-stack" form={form} onSubmit={submit}>
        <Form.Input
          autoComplete="current-password"
          label="Password"
          name="password"
          type="password"
        />
        <Button disabled={unlock.isPending} type="submit">
          {unlock.isPending ? "Checking…" : "Open"}
        </Button>
        {message ? <Alert>{message}</Alert> : null}
      </Form.Context>
    </Section>
  );
}
