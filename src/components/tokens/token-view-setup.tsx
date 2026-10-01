"use client";

import { useState } from "react";
import { ConnectionDialog } from "@/components/tokens/connection-dialog";
import { Button } from "@/ui/Button";

export function TokenViewSetup() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="secondary small" onClick={() => setOpen(true)} type="button">
        View setup
      </Button>
      {open ? <ConnectionDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
