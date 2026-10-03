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
  description?: string;
  unlockPath?: string;
}

interface UnlockValues {
  password: string;
}

async function unlockWithPassword(path: string, password: string) {
  if (!password.trim()) throw new Error("Enter the password.");
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const folder = path.includes("/api/folders/");
    throw new Error(
      folder
        ? "That password does not open this folder."
        : "That password does not open this document.",
    );
  }
}

export function LockedPassword(props: Properties) {
  const { id, description, unlockPath } = props;
  const router = useRouter();
  const path = unlockPath ?? `/api/documents/${id}/unlock`;
  const form = useForm<UnlockValues>({
    defaultValues: { password: "" },
  });
  const unlock = useMutation({
    mutationFn: (password: string) => unlockWithPassword(path, password),
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
      <Paragraph>
        {description ?? "The owner protected this note or diagram with a password."}
      </Paragraph>
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
