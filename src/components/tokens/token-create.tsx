"use client";

import { useState } from "react";
import { TokenCreateDialog } from "@/components/tokens/token-create-dialog";
import { Button } from "@/ui/Button";

export function TokenCreate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="token-create">
      <Button
        className="secondary"
        expanded={open}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        Create API key
      </Button>
      {open ? <TokenCreateDialog onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
