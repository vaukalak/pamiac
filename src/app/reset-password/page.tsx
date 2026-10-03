import { AppHeader } from "@/components/header/app-header";
import { CircuitBoard } from "@/components/home/circuit-board";
import { ResetPasswordForm } from "@/components/reset-password/reset-password-form";
import { ResetPasswordInvalid } from "@/components/reset-password/reset-password-invalid";
import { Page } from "@/ui/Page";
import { Section } from "@/ui/Section";

export const dynamic = "force-dynamic";

interface Properties {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordPage(props: Properties) {
  const { searchParams } = props;
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const expired = params.error === "INVALID_TOKEN" || token === "";

  return (
    <div className="home">
      <CircuitBoard />
      <AppHeader />
      <Page className="home-sign-in">
        <Section className="home-sign-in-panel">
          {expired ? <ResetPasswordInvalid /> : <ResetPasswordForm token={token} />}
        </Section>
      </Page>
      <footer className="home-foot">
        <p>Built for human ideas and machine intelligence.</p>
      </footer>
    </div>
  );
}
