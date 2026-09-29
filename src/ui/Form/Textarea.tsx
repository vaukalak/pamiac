"use client";

import { useFormContext } from "react-hook-form";
import { Alert } from "@/ui/Alert";

interface Properties {
  name: string;
  label: string;
  rows?: number;
  placeholder?: string;
}

export function FormTextarea(props: Properties) {
  const { name, label, rows = 5, placeholder } = props;
  const { register, formState } = useFormContext();
  const fieldError = formState.errors[name];
  const message = typeof fieldError?.message === "string" ? fieldError.message : null;
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <textarea
        aria-describedby={message ? errorId : undefined}
        aria-invalid={message ? true : undefined}
        id={name}
        placeholder={placeholder}
        rows={rows}
        {...register(name)}
      />
      {message ? <Alert id={errorId}>{message}</Alert> : null}
    </div>
  );
}
