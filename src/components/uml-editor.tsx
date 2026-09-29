"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { UmlCanvas } from "@/components/diagram/uml-canvas";

interface Properties {
  id: string;
  initial: string;
  version: number;
  editable: boolean;
}

export function UmlEditor(props: Properties) {
  const { id, initial, version, editable } = props;

  return (
    <ReactFlowProvider>
      <UmlCanvas editable={editable} id={id} initial={initial} version={version} />
    </ReactFlowProvider>
  );
}
