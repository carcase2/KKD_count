import type { LabelHTMLAttributes } from "react";

export function Label({
  className = "",
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={["text-sm font-medium text-slate-700", className].join(" ")}
      {...props}
    >
      {children}
    </label>
  );
}
