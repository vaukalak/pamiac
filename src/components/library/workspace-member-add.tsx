"use client";

import { useMutation } from "@tanstack/react-query";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { addWorkspacePerson } from "@/lib/library-workspaces";

interface Properties {
  workspaceId: string;
}

export function WorkspaceMemberAdd(props: Properties) {
  const { workspaceId } = props;
  const mutation = useMutation({
    mutationFn: (email: string) => addWorkspacePerson(workspaceId, email),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    mutation.mutate(email, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

  if (workspaceId === PERSONAL_SPACE_ID) return null;

  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const saved = mutation.isSuccess ? mutation.data : null;

  return (
    <form className="workspace-create" onSubmit={submit}>
      <label htmlFor="workspace-person-email">Email</label>
      <input autoComplete="email" id="workspace-person-email" name="email" required type="email" />
      <button className="btn secondary" disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Adding…" : "Add person"}
      </button>
      {message ? <p className="error">{message}</p> : null}
      {saved?.status === "member" ? <p className="hint">Added to this workspace.</p> : null}
      {saved?.status === "pending" ? (
        <p className="hint">Saved for this workspace. They have no account yet.</p>
      ) : null}
    </form>
  );
}
