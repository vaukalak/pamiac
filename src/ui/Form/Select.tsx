"use client";

import { useFormContext } from "react-hook-form";
import { Alert } from "@/ui/Alert";
import { FormSelectMenu } from "@/ui/Form/SelectMenu";

interface Choice {
  value: string;
  label: string;
}

interface Properties {
  name: string;
  label: string;
  options: readonly Choice[];
}

export function FormSelect(props: Properties) {
  const { name, label, options } = props;
  const { formState } = useFormContext();
  const fieldError = formState.errors[name];
  const message = typeof fieldError?.message === "string" ? fieldError.message : null;
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <FormSelectMenu
        describedBy={message ? errorId : undefined}
        invalid={Boolean(message)}
        name={name}
        options={options}
      />
      {message ? <Alert id={errorId}>{message}</Alert> : null}
    </div>
  );
}
