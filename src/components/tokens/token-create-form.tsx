"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { TokenScopeFields } from "@/components/tokens/token-scope-fields";
import { TokenSecret } from "@/components/tokens/token-secret";
import { tokensQueryKey } from "@/components/tokens/tokens-query";
import {
  EXPIRATIONS,
  scopePayload,
  selectedSpaceIds,
  type Expiration,
  type ScopeChoice,
  type TokenValues,
} from "@/components/tokens/token-values";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

async function createToken(values: TokenValues, failure: string) {
  const expiration =
    values.expiration === "date" ? { date: values.date } : { preset: values.expiration };
  const response = await fetch("/api/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: values.name,
      expiration,
      scope: scopePayload(values.scope, values.spaces),
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    token?: string;
    error?: string;
  } | null;
  if (!response.ok || !body?.token) {
    throw new Error(body?.error ?? failure);
  }
  return body.token;
}

interface Properties {
  defaultExpiration?: Expiration;
  defaultName?: string;
  expirationLabel?: string;
  expirations?: readonly { value: Expiration; label: string }[];
  failureMessage?: string;
  idPrefix?: string;
  namePlaceholder?: string;
  onCreated?: (token: string) => void;
  scopeLabel?: string;
  scopeOptions?: readonly { value: ScopeChoice; label: string }[];
  submitLabel?: string;
  suppressSecret?: boolean;
}

export function TokenCreateForm(props: Properties) {
  const {
    defaultExpiration,
    defaultName,
    expirationLabel = "Expiration",
    expirations = EXPIRATIONS,
    failureMessage = "Could not create a key",
    idPrefix = "token-create",
    namePlaceholder,
    onCreated,
    scopeLabel = "Scope",
    scopeOptions,
    submitLabel = "Create API key",
    suppressSecret = false,
  } = props;
  const queryClient = useQueryClient();
  const onCreatedRef = useRef(onCreated);
  onCreatedRef.current = onCreated;
  const form = useForm<TokenValues>({
    defaultValues: {
      name: defaultName ?? "Cloud agent",
      scope: "all",
      spaces: {},
      expiration: defaultExpiration ?? "never",
      date: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: TokenValues) => createToken(values, failureMessage),
    onSuccess: (token) => {
      void queryClient.invalidateQueries({ queryKey: tokensQueryKey });
      onCreatedRef.current?.(token);
    },
  });
  const expiration = form.watch("expiration");
  const createError = mutation.error instanceof Error ? mutation.error.message : null;
  const revealed = mutation.data ? <TokenSecret secret={mutation.data} /> : null;

  function submit(values: TokenValues) {
    if (values.expiration === "date" && !values.date) {
      form.setError("date", { type: "required", message: "Choose an expiration date" });
      return;
    }
    if (values.scope === "selected" && selectedSpaceIds(values.spaces).length === 0) {
      form.setError("scope", { type: "required", message: "Choose at least one space" });
      return;
    }
    form.clearErrors("date");
    form.clearErrors("scope");
    mutation.mutate(values);
  }

  return (
    <Form.Context className="form-stack token-form" form={form} onSubmit={submit}>
      <TokenScopeFields
        idPrefix={idPrefix}
        namePlaceholder={namePlaceholder}
        scopeLabel={scopeLabel}
        scopeOptions={scopeOptions}
      />
      <Form.Select
        id={`${idPrefix}-expiration`}
        label={expirationLabel}
        name="expiration"
        options={expirations}
      />
      {expiration === "date" ? (
        <Form.Input id={`${idPrefix}-date`} label="Expiration date" name="date" type="date" />
      ) : null}
      {suppressSecret ? null : revealed}
      {createError ? <Alert>{createError}</Alert> : null}
      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Creating…" : submitLabel}
      </Button>
    </Form.Context>
  );
}
