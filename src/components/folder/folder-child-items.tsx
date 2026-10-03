import { FolderChild } from "@/components/folder/folder-child";

interface Properties {
  folders: { id: string; name: string }[];
}

export function FolderChildItems(props: Properties) {
  const { folders } = props;

  return (
    <ul className="folder-child-list">
      {folders.map((folder) => (
        <FolderChild id={folder.id} key={folder.id} name={folder.name} />
      ))}
    </ul>
  );
}
