import Link from "next/link";

interface Properties {
  href?: string;
}

export function LibraryBrand(props: Properties) {
  const { href = "/workspace" } = props;

  return (
    <Link className="brand" href={href}>
      <span aria-hidden="true" className="brand-mark" />
      Pamiac
    </Link>
  );
}
