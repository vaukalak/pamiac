"use client";

import { TokenScopeSpaces } from "@/components/tokens/token-scope-spaces";
import { SCOPE_OPTIONS, type ScopeChoice } from "@/components/tokens/token-values";
import { Form } from "@/ui/Form";

interface Properties {
  idPrefix: string;
  scopeLabel?: string;
  scopeOptions?: readonly { value: ScopeChoice; label: string }[];
}

export function TokenScopeFields(props: Properties) {
  const { idPrefix, scopeLabel = "Scope", scopeOptions = SCOPE_OPTIONS } = props;

  return (
    <>
      <Form.Input id={`${idPrefix}-name`} label="Name" name="name" />
      <Form.Select
        id={`${idPrefix}-scope`}
        label={scopeLabel}
        name="scope"
        options={scopeOptions}
      />
      <TokenScopeSpaces />
    </>
  );
}
