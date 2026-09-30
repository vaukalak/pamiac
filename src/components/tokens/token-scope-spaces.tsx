"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { TokenScopeSpace } from "@/components/tokens/token-scope-space";
import type { TokenValues } from "@/components/tokens/token-values";
import { librarySpaces } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";

export function TokenScopeSpaces() {
  const spaces = useQuery(workspacesQueryOptions());
  const { watch } = useFormContext<TokenValues>();
  const scope = watch("scope");
  const spacesError = spaces.error instanceof Error ? spaces.error.message : null;
  if (scope !== "selected") return null;
  const list = librarySpaces(spaces.data ?? []);

  return (
    <fieldset className="token-spaces">
      <legend>Spaces</legend>
      {list.map((space) => (
        <TokenScopeSpace key={space.id} id={space.id} label={space.label} />
      ))}
      {spacesError ? <Alert>{spacesError}</Alert> : null}
    </fieldset>
  );
}
