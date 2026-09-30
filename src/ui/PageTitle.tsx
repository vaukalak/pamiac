import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  title: string;
  eyebrow?: string;
  subtitle?: string;
}

export function PageTitle(props: Properties) {
  const { title, eyebrow, subtitle } = props;

  return (
    <>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {subtitle ? <Paragraph>{subtitle}</Paragraph> : null}
    </>
  );
}
