"use client";

import { useFormContext } from "react-hook-form";
import { FormSelectOption } from "@/ui/Form/SelectOption";

interface Choice {
  value: string;
  label: string;
}

interface Properties {
  name: string;
  options: readonly Choice[];
  describedBy?: string;
  id?: string;
  invalid?: boolean;
}

export function FormSelectMenu(props: Properties) {
  const { name, options, describedBy, id, invalid = false } = props;
  const { register } = useFormContext();

  return (
    <select
      aria-describedby={describedBy}
      aria-invalid={invalid ? true : undefined}
      id={id ?? name}
      {...register(name)}
    >
      {options.map((option) => (
        <FormSelectOption key={option.value} label={option.label} value={option.value} />
      ))}
    </select>
  );
}
