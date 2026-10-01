"use client";

import type { UseFormReturn } from "react-hook-form";
import type { TokenFilterValues } from "@/components/tokens/token-filter";
import { Form } from "@/ui/Form";

interface Properties {
  form: UseFormReturn<TokenFilterValues>;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Expired", label: "Expired" },
  { value: "Revoked", label: "Revoked" },
] as const;

export function TokenFilters(props: Properties) {
  const { form } = props;

  return (
    <Form.Context className="token-filters" form={form} onSubmit={() => undefined}>
      <Form.Input label="Search keys" name="query" type="text" />
      <Form.Select label="Status" name="status" options={STATUS_OPTIONS} />
    </Form.Context>
  );
}
