import type { Metadata } from "next";
import { AppHeader } from "@/components/header/app-header";
import { CircuitBoard } from "@/components/home/circuit-board";
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
    <div className="home">
      <CircuitBoard />
      <AppHeader />
      <Page className="home-support">
        <Section className="home-support-panel">
          <PageTitle
            eyebrow="Support"
            subtitle="This message goes to Pamiac support."
            title="Contact support"
          />
          <Paragraph>Use the email you sign in with.</Paragraph>
          <SupportForm />
        </Section>
      </Page>
      <footer className="home-foot">
        <p>Built for human ideas and machine intelligence.</p>
      </footer>
    </div>
  );
}
