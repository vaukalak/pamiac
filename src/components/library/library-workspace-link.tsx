import Link from "next/link";

interface Properties {
  current: boolean;
  href: string;
  label: string;
}

export function LibraryWorkspaceLink(props: Properties) {
  const { current, href, label } = props;

  return (
    <Link aria-current={current ? "page" : undefined} className="library-nav-item" href={href}>
      {label}
    </Link>
  );
}
