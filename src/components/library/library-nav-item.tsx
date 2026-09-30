import Link from "next/link";
import { Button } from "@/ui/Button";

interface Properties {
  label: string;
  pressed: boolean;
  href?: string;
  onSelect?: () => void;
}

export function LibraryNavItem(props: Properties) {
  const { href, label, onSelect, pressed } = props;

  if (href) {
    return (
      <Link className="library-nav-item" href={href}>
        {label}
      </Link>
    );
  }

  return (
    <Button className="library-nav-item" onClick={onSelect} pressed={pressed} type="button">
      {label}
    </Button>
  );
}
