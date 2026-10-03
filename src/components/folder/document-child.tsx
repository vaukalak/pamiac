import Link from "next/link";

interface Properties {
  id: string;
  title: string;
}

export function DocumentChild(props: Properties) {
  const { id, title } = props;

  return (
    <li>
      <Link href={`/d/${id}`}>{title}</Link>
    </li>
  );
}
