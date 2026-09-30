import type { LibraryView } from "@/components/library/board-document";
import { LibrarySearch, type LibrarySearchValues } from "@/components/library/library-search";
import { ViewToggle } from "@/components/library/view-toggle";
import type { UseFormReturn } from "react-hook-form";

interface Properties {
  form: UseFormReturn<LibrarySearchValues>;
  onView: (view: LibraryView) => void;
  view: LibraryView;
}

export function LibraryTools(props: Properties) {
  const { form, onView, view } = props;

  return (
    <div className="library-tools">
      <LibrarySearch form={form} />
      <ViewToggle onChange={onView} view={view} />
    </div>
  );
}
