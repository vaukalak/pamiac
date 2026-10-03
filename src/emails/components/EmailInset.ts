import { createElement, type CSSProperties, type ReactNode } from "react";

interface Properties {
  children?: ReactNode;
  tableStyle: CSSProperties;
  padding: string;
  className?: string;
  cellClassName?: string;
}

export function EmailInset(props: Properties) {
  const { children, tableStyle, padding, className, cellClassName } = props;

  return createElement(
    "table",
    {
      align: "center",
      border: 0,
      cellPadding: 0,
      cellSpacing: 0,
      className,
      role: "presentation",
      style: {
        ...tableStyle,
        boxSizing: "border-box",
        width: "100%",
      },
      width: "100%",
    },
    createElement(
      "tbody",
      null,
      createElement(
        "tr",
        null,
        createElement(
          "td",
          {
            className: cellClassName,
            style: { padding },
          },
          children,
        ),
      ),
    ),
  );
}
