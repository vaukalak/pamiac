"use client";

import { useFormContext } from "react-hook-form";

interface Properties {
  id: string;
  label: string;
}

export function TokenScopeSpace(props: Properties) {
  const { id, label } = props;
  const { register } = useFormContext();

  return (
    <label className="token-space">
      <input type="checkbox" {...register(`spaces.${id}`)} />
      {label}
    </label>
  );
}
