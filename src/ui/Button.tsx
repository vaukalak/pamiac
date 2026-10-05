import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  pressed?: boolean;
  expanded?: boolean;
  title?: string;
}

export function Button(props: Properties) {
  const {
    children,
    type = "button",
    disabled = false,
    className,
    onClick,
    pressed,
    expanded,
    title,
  } = props;
  const classes = className ? `btn ${className}` : "btn";

  return (
    <button
      aria-expanded={expanded}
      aria-pressed={pressed}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type={type}
    >
      {children}
    </button>
  );
}
