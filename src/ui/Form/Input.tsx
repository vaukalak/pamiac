"use client";

import { useFormContext } from "react-hook-form";
import { Alert } from "@/ui/Alert";

interface Properties {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  placeholder?: string;
}

export function FormInput(props: Properties) {
  const { name, label, type = "text", autoComplete, placeholder } = props;
  const { register, formState } = useFormContext();
  const fieldError = formState.errors[name];
  const message = typeof fieldError?.message === "string" ? fieldError.message : null;
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        aria-describedby={message ? errorId : undefined}
        aria-invalid={message ? true : undefined}
        autoComplete={autoComplete}
        id={name}
        placeholder={placeholder}
        type={type}
        {...register(name)}
      />
      {message ? <Alert id={errorId}>{message}</Alert> : null}
    </div>
  );
}
