import Link from "next/link";
import { EditIcon } from "@/components/document/edit-icon";

interface Properties {
  id: string;
}

export function RequestEditLogin(props: Properties) {
  const { id } = props;

  return (
    <Link className="btn secondary icon-button" href={`/login?next=/d/${id}`} title="Login">
      <EditIcon />
      <span className="visually-hidden">Login</span>
    </Link>
  );
}
