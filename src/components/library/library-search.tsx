"use client";

import type { UseFormReturn } from "react-hook-form";
import { Form } from "@/ui/Form";

export interface LibrarySearchValues {
  query: string;
}

interface Properties {
  form: UseFormReturn<LibrarySearchValues>;
}

export function LibrarySearch(props: Properties) {
  const { form } = props;

  return (
    <Form.Context className="library-search" form={form} onSubmit={() => undefined}>
      <Form.Input
        autoComplete="off"
        label="Search workspace"
        name="query"
        placeholder="Search workspace..."
        type="text"
      />
    </Form.Context>
  );
}
