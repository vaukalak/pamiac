"use client";

import { TokenScopeSpaces } from "@/components/tokens/token-scope-spaces";
import { SCOPE_OPTIONS } from "@/components/tokens/token-values";
import { Form } from "@/ui/Form";

interface Properties {
  idPrefix: string;
}

export function TokenScopeFields(props: Properties) {
  const { idPrefix } = props;

  return (
    <>
      <Form.Input id={`${idPrefix}-name`} label="Name" name="name" />
      <Form.Select id={`${idPrefix}-scope`} label="Scope" name="scope" options={SCOPE_OPTIONS} />
      <TokenScopeSpaces />
    </>
  );
}
