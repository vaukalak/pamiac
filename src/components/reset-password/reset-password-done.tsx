import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

export function ResetPasswordDone() {
  return (
    <div className="form-stack" role="status">
      <PageTitle title="Password updated" />
      <Paragraph>You can sign in with the new password.</Paragraph>
      <Link className="btn" href="/login">
        Sign in
      </Link>
    </div>
  );
}
