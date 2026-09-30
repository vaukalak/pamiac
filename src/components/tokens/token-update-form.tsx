"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenScopeFields } from "@/components/tokens/token-scope-fields";
import { tokensQueryKey } from "@/components/tokens/tokens-query";
import {
  scopePayload,
  selectedSpaceIds,
  type TokenUpdateValues,
} from "@/components/tokens/token-values";
import { librarySpaces } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  token: AgentToken;
}

async function updateToken(id: string, values: TokenUpdateValues) {
  const response = await fetch(`/api/tokens?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: values.name,
      scope: scopePayload(values.scope, values.spaces),
    }),
  });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Could not update this key");
}

export function TokenUpdateForm(props: Properties) {
  const { token } = props;
  const queryClient = useQueryClient();
  const spaces = useQuery(workspacesQueryOptions());
  const form = useForm<TokenUpdateValues>({
    defaultValues: {
      name: token.name,
      scope: token.allScopes ? "all" : "selected",
      spaces: Object.fromEntries(token.workspaceIds.map((id) => [id, true])),
    },
  });
  const ready = useRef(false);
  const mutation = useMutation({
    mutationFn: (values: TokenUpdateValues) => updateToken(token.id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tokensQueryKey });
    },
  });
  const saveError = mutation.error instanceof Error ? mutation.error.message : null;

  useEffect(() => {
    if (!spaces.data || ready.current) return;
    ready.current = true;
    const current = form.getValues("spaces");
    form.setValue(
      "spaces",
      Object.fromEntries(
        librarySpaces(spaces.data).map((space) => [
          space.id,
          current[space.id] ?? token.workspaceIds.includes(space.id),
        ]),
      ),
    );
  }, [form, spaces.data, token.workspaceIds]);

  function submit(values: TokenUpdateValues) {
    if (values.scope === "selected" && selectedSpaceIds(values.spaces).length === 0) {
      form.setError("scope", { type: "required", message: "Choose at least one space" });
      return;
    }
    form.clearErrors("scope");
    mutation.mutate(values);
  }

  return (
    <Form.Context className="form-stack token-form" form={form} onSubmit={submit}>
      <TokenScopeFields idPrefix={`token-update-${token.id}`} />
      {mutation.isSuccess ? <Paragraph>Scope saved.</Paragraph> : null}
      {saveError ? <Alert>{saveError}</Alert> : null}
      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Saving…" : "Save"}
      </Button>
    </Form.Context>
  );
}
