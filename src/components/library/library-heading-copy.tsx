import type { LibraryFilter } from "@/components/library/board-document";
import { LibraryBreadcrumb } from "@/components/library/library-breadcrumb";
import { PageTitle } from "@/ui/PageTitle";

interface Properties {
  filter: LibraryFilter;
  spaceName: string;
}

export function LibraryHeadingCopy(props: Properties) {
  const { filter, spaceName } = props;

  return (
    <div className="library-heading-copy">
      <LibraryBreadcrumb filter={filter} spaceName={spaceName} />
      <PageTitle
        eyebrow="Your knowledge, connected"
        subtitle="A shared memory for you and your agents."
        title={spaceName}
      />
    </div>
  );
}
