import { createElement } from "react";
import { Column, Text } from "@react-email/components";
import { wordmarkStyle } from "../email-theme.ts";

export function EmailWordmark() {
  return createElement(
    Column,
    { style: { verticalAlign: "middle" } },
    createElement(Text, { style: wordmarkStyle }, "Pamiac"),
  );
}
