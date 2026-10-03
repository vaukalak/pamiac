import Link from "next/link";

interface Properties {
  id: string;
  name: string;
}

export function FolderChild(props: Properties) {
  const { id, name } = props;

  return (
    <li>
      <Link href={`/f/${id}`}>{name}</Link>
    </li>
  );
}
