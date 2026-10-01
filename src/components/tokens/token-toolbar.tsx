"use client";

import type { UseFormReturn } from "react-hook-form";
import type { TokenFilterValues } from "@/components/tokens/token-filter";
import { TokenCreate } from "@/components/tokens/token-create";
import { TokenFilters } from "@/components/tokens/token-filters";

interface Properties {
  form: UseFormReturn<TokenFilterValues>;
}

export function TokenToolbar(props: Properties) {
  const { form } = props;

  return (
    <div className="token-toolbar">
      <TokenFilters form={form} />
      <TokenCreate />
    </div>
  );
}
