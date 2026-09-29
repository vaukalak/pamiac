import type { Metadata } from "next";
import { AppHeader } from "@/components/header/app-header";
import { SupportForm } from "@/components/support/support-form";
import { Page } from "@/ui/Page";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

export const metadata: Metadata = {
  title: "Support",
  description: "Send a message to Pamiac support.",
};

export default function SupportPage() {
  return (
    <>
      <AppHeader />
      <Page className="auth-wrap">
        <Section className="auth-card">
          <PageTitle
            eyebrow="Support"
            subtitle="This message goes to Pamiac support."
            title="Contact support"
          />
          <Paragraph>Use the email you sign in with.</Paragraph>
          <SupportForm />
        </Section>
      </Page>
    </>
  );
}
