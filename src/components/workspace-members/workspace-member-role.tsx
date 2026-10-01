"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { WorkspaceRole } from "@/lib/library-spaces";
import { updateWorkspaceMemberRole, workspaceRosterQueryKey } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Form } from "@/ui/Form";

interface Properties {
  memberId: string;
  role: WorkspaceRole;
  workspaceId: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];

export function WorkspaceMemberRole(props: Properties) {
  const { memberId, role, workspaceId } = props;
  const fieldName = `role-${memberId}`;
  const form = useForm<Record<string, WorkspaceRole>>({
    defaultValues: { [fieldName]: role },
  });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (next: WorkspaceRole) => updateWorkspaceMemberRole(workspaceId, memberId, next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceRosterQueryKey(workspaceId) });
    },
  });
  const selected = form.watch(fieldName);
  const { mutate } = mutation;

  useEffect(() => {
    if (selected !== "admin" && selected !== "editor") return;
    if (selected === role) return;
    mutate(selected);
  }, [mutate, role, selected]);

  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <Form.Context className="workspace-member-role" form={form} onSubmit={() => undefined}>
      <Form.Select label="Role" name={fieldName} options={ROLE_OPTIONS} />
      {message ? <Alert>{message}</Alert> : null}
    </Form.Context>
  );
}
