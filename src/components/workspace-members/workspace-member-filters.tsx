"use client";

import type { UseFormReturn } from "react-hook-form";
import { Form } from "@/ui/Form";

interface FilterValues {
  query: string;
  memberRole: string;
}

interface Properties {
  form: UseFormReturn<FilterValues>;
}

const ROLE_FILTERS = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];

export function WorkspaceMemberFilters(props: Properties) {
  const { form } = props;

  function submit() {}

  return (
    <Form.Context className="workspace-member-filters" form={form} onSubmit={submit}>
      <Form.Input label="Search members" name="query" type="text" />
      <Form.Select label="Role" name="memberRole" options={ROLE_FILTERS} />
    </Form.Context>
  );
}

export type { FilterValues };
