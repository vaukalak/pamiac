import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  id?: string;
  onClick?: () => void;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  popup?: "dialog" | "listbox" | "menu";
  role?: "option";
  selected?: boolean;
  title?: string;
}

export function Button(props: Properties) {
  const {
    children,
    type = "button",
    disabled = false,
    className,
    controls,
    id,
    onClick,
    popup,
    pressed,
    expanded,
    role,
    selected,
    title,
  } = props;
  const classes = className ? `btn ${className}` : "btn";

  return (
    <button
      aria-controls={controls}
      aria-expanded={expanded}
      aria-haspopup={popup}
      aria-pressed={pressed}
      aria-selected={selected}
      className={classes}
      disabled={disabled}
      id={id}
      onClick={onClick}
      role={role}
      title={title}
      type={type}
    >
      {children}
    </button>
  );
}
