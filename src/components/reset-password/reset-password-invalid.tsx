import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

export function ResetPasswordInvalid() {
  return (
    <div className="form-stack">
      <PageTitle title="That link has expired" />
      <Paragraph>Request a new reset link from the sign-in page.</Paragraph>
      <Link className="btn ghost" href="/login">
        Back to sign in
      </Link>
    </div>
  );
}
