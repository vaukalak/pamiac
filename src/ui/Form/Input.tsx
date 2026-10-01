"use client";

import { useFormContext } from "react-hook-form";
import { Alert } from "@/ui/Alert";

interface Properties {
  name: string;
  label: string;
  id?: string;
  type?: "text" | "email" | "password" | "date";
  autoComplete?: string;
  placeholder?: string;
}

export function FormInput(props: Properties) {
  const { name, label, id, type = "text", autoComplete, placeholder } = props;
  const fieldId = id ?? name;
  const { register, formState } = useFormContext();
  const fieldError = formState.errors[name];
  const message = typeof fieldError?.message === "string" ? fieldError.message : null;
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={fieldId}>{label}</label>
      <input
        aria-describedby={message ? errorId : undefined}
        aria-invalid={message ? true : undefined}
        autoComplete={autoComplete}
        id={fieldId}
        placeholder={placeholder}
        type={type}
        {...register(name)}
      />
      {message ? <Alert id={errorId}>{message}</Alert> : null}
    </div>
  );
}
