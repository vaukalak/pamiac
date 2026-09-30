"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { PERSONAL_SPACE_ID, type WorkspaceRole } from "@/lib/library-spaces";
import { addWorkspacePerson, workspaceRosterQueryKey } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  workspaceId: string;
}

interface MemberValues {
  email: string;
  role: WorkspaceRole;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];

export function WorkspaceMemberAdd(props: Properties) {
  const { workspaceId } = props;
  const queryClient = useQueryClient();
  const form = useForm<MemberValues>({
    defaultValues: { email: "", role: "editor" },
  });
  const mutation = useMutation({
    mutationFn: (values: MemberValues) =>
      addWorkspacePerson(workspaceId, values.email, values.role),
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({ queryKey: workspaceRosterQueryKey(workspaceId) });
    },
  });

  function submit(values: MemberValues) {
    mutation.mutate(values);
  }

  if (workspaceId === PERSONAL_SPACE_ID) return null;

  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const saved = mutation.isSuccess ? mutation.data : null;

  return (
    <Form.Context className="workspace-create workspace-member-add" form={form} onSubmit={submit}>
      <Form.Input autoComplete="email" label="Email" name="email" type="email" />
      <Form.Select label="Role" name="role" options={roleOptions} />
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
