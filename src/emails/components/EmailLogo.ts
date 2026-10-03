import { createElement } from "react";
import { Column, Img } from "@react-email/components";
import { appBaseUrl } from "../../lib/config.ts";

export function EmailLogo() {
  return createElement(
    Column,
    { style: { width: "48px", verticalAlign: "middle" } },
    createElement(Img, {
      alt: "Pamiac",
      height: "32",
      src: `${appBaseUrl()}/icon.svg`,
      style: { display: "block", border: "0" },
      width: "32",
    }),
  );
}
