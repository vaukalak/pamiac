import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  pressed?: boolean;
}

export function Button(props: Properties) {
  const { children, type = "button", disabled = false, className, onClick, pressed } = props;
  const classes = className ? `btn ${className}` : "btn";

  return (
    <button
      aria-pressed={pressed}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
