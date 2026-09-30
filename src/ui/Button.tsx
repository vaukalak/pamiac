import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Button(props: Properties) {
  const { children, type = "button", disabled = false, className, onClick } = props;
  const classes = className ? `btn ${className}` : "btn";

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}
