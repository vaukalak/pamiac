"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { addWorkspacePerson } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  workspaceId: string;
}

interface MemberValues {
  email: string;
}

export function WorkspaceMemberAdd(props: Properties) {
  const { workspaceId } = props;
  const form = useForm<MemberValues>({
    defaultValues: { email: "" },
  });
  const mutation = useMutation({
    mutationFn: (email: string) => addWorkspacePerson(workspaceId, email),
  });

  function submit(values: MemberValues) {
    mutation.mutate(values.email, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

  if (workspaceId === PERSONAL_SPACE_ID) return null;

  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const saved = mutation.isSuccess ? mutation.data : null;

  return (
    <Form.Context className="workspace-create" form={form} onSubmit={submit}>
      <Form.Input autoComplete="email" label="Email" name="email" type="email" />
      <Button className="secondary" disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Adding…" : "Add person"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
      {saved?.status === "member" ? (
        <Paragraph className="hint">Added to this workspace.</Paragraph>
      ) : null}
      {saved?.status === "pending" ? (
        <Paragraph className="hint">Saved for this workspace. They have no account yet.</Paragraph>
      ) : null}
    </Form.Context>
  );
}
