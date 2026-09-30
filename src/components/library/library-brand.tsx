import Link from "next/link";

export function LibraryBrand() {
  return (
    <Link className="brand" href="/workspace">
      <span aria-hidden="true" className="brand-mark" />
      Pamiac
    </Link>
  );
}
