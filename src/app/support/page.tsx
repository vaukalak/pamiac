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
      <Page className="hero">
        <div>
          <PageTitle eyebrow="Support" title="Contact support" />
          <Paragraph className="lede">This message goes to Pamiac support.</Paragraph>
        </div>
        <Section className="feature form-stack">
          <Paragraph>Use the email you sign in with.</Paragraph>
          <SupportForm />
        </Section>
      </Page>
    </>
  );
}
