"use client";

import { useState } from "react";
import { TokenCreateForm } from "@/components/tokens/token-create-form";
import { Button } from "@/ui/Button";

export function TokenCreate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="token-create">
      <Button className="secondary" onClick={() => setOpen((value) => !value)} type="button">
        Create API key
      </Button>
      {open ? <TokenCreateForm /> : null}
    </div>
  );
}
