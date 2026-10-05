"use client";

import type { UseFormReturn } from "react-hook-form";
import { Form } from "@/ui/Form";

export interface WorkspaceSwitcherSearchValues {
  query: string;
}

interface Properties {
  form: UseFormReturn<WorkspaceSwitcherSearchValues>;
}

export function WorkspaceSwitcherSearch(props: Properties) {
  const { form } = props;

  return (
    <Form.Context className="workspace-switcher-search" form={form} onSubmit={() => undefined}>
      <Form.Input
        autoComplete="off"
        label="Search workspaces"
        name="query"
        placeholder="Search workspaces"
        type="text"
      />
    </Form.Context>
  );
}
