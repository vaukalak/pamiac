"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { filterTokens, type TokenFilterValues } from "@/components/tokens/token-filter";
import { TokenKeysBody } from "@/components/tokens/token-keys-body";
import { TokenKeysHeading } from "@/components/tokens/token-keys-heading";
import { TokenToolbar } from "@/components/tokens/token-toolbar";
import { tokensQueryOptions } from "@/components/tokens/tokens-query";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

export function TokenKeys() {
  const form = useForm<TokenFilterValues>({
    defaultValues: { query: "", status: "all" },
  });
  const tokens = useQuery(tokensQueryOptions());
  const query = form.watch("query");
  const status = form.watch("status");
  const rows = tokens.data ?? [];
  const visible = filterTokens(rows, query ?? "", status ?? "all");
  const filtered = (query ?? "").trim() !== "" || (status ?? "all") !== "all";
  const error = tokens.error instanceof Error ? tokens.error.message : null;

  return (
    <Section className="token-keys">
      <TokenKeysHeading count={rows.length} />
      <TokenToolbar form={form} />
      <TokenKeysBody
        error={error}
        filtered={filtered}
        pending={tokens.isPending}
        tokens={visible}
      />
      <Paragraph>
        A key reaches only the spaces you chose. Revoke a key to disconnect an agent.
      </Paragraph>
    </Section>
  );
}
