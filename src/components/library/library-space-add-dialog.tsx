import type { ReactNode } from "react";
import { LibrarySpaceAddPanel } from "@/components/library/library-space-add-panel";

interface Properties {
  form: ReactNode;
  onClose: () => void;
}

export function LibrarySpaceAddDialog(props: Properties) {
  const { form, onClose } = props;

  return (
    <div className="share-backdrop" onPointerDown={onClose} role="presentation">
      <LibrarySpaceAddPanel form={form} onClose={onClose} />
    </div>
  );
}
