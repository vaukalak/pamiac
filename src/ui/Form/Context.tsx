"use client";

import type { ReactNode } from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

interface Properties<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
  className?: string;
}

export function FormContext<T extends FieldValues>(props: Properties<T>) {
  const { form, onSubmit, children, className } = props;

  return (
    <FormProvider {...form}>
      <form className={className} noValidate onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
