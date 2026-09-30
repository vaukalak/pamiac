"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { librarySpaces, PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

interface Properties {
  onCreated: (secret: string) => void;
}

const EXPIRATIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "date", label: "Custom date" },
  { value: "never", label: "No expiration" },
] as const;

type Expiration = (typeof EXPIRATIONS)[number]["value"];

interface TokenValues {
  name: string;
  workspaceId: string;
  expiration: Expiration;
  date: string;
}

async function createToken(values: TokenValues) {
  const expiration =
    values.expiration === "date" ? { date: values.date } : { preset: values.expiration };
  const response = await fetch("/api/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: values.name,
      expiration,
      workspaceId: values.workspaceId,
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    token?: string;
    error?: string;
  } | null;
  if (!response.ok || !body?.token) {
    throw new Error(body?.error ?? "Could not create a key");
  }
  return body.token;
}

export function TokenForm(props: Properties) {
  const { onCreated } = props;
  const form = useForm<TokenValues>({
    defaultValues: {
      name: "Cloud agent",
      workspaceId: PERSONAL_SPACE_ID,
      expiration: "never",
      date: "",
    },
  });
  const spaces = useQuery(workspacesQueryOptions());
  const mutation = useMutation({
    mutationFn: createToken,
    onSuccess: (token) => {
      onCreated(token);
    },
  });
  const expiration = form.watch("expiration");
  const workspaceOptions = librarySpaces(spaces.data ?? []).map((space) => ({
    value: space.id,
    label: space.label,
  }));
  const createError = mutation.error instanceof Error ? mutation.error.message : null;
  const spacesError = spaces.error instanceof Error ? spaces.error.message : null;

  function submit(values: TokenValues) {
    if (values.expiration === "date" && !values.date) {
      form.setError("date", { type: "required", message: "Choose an expiration date" });
      return;
    }
    form.clearErrors("date");
    mutation.mutate(values);
  }

  return (
    <Form.Context className="form-stack token-form" form={form} onSubmit={submit}>
      <Form.Input label="Name" name="name" />
      <Form.Select label="Workspace" name="workspaceId" options={workspaceOptions} />
      <Form.Select label="Expiration" name="expiration" options={EXPIRATIONS} />
      {expiration === "date" ? (
        <Form.Input label="Expiration date" name="date" type="date" />
      ) : null}
      {spacesError ? <Alert>{spacesError}</Alert> : null}
      {createError ? <Alert>{createError}</Alert> : null}
      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Creating…" : "Create API key"}
      </Button>
    </Form.Context>
  );
}
