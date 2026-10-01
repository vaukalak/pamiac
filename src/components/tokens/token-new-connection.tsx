"use client";

import { useState } from "react";
import { ConnectionDialog } from "@/components/tokens/connection-dialog";
import { Button } from "@/ui/Button";

export function TokenNewConnection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="library-heading-actions">
      <Button onClick={() => setOpen(true)} type="button">
        New connection
      </Button>
      {open ? <ConnectionDialog onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
