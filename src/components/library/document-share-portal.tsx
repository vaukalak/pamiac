"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Properties {
  children: ReactNode;
}

export function DocumentSharePortal(props: Properties) {
  const { children } = props;
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const shell = document.querySelector(".library-shell");
    setRoot(shell instanceof HTMLElement ? shell : document.body);
  }, []);

  if (!root) return null;

  return createPortal(children, root);
}
