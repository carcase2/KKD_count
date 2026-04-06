import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={[
        "flex h-11 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base text-slate-900 shadow-sm transition-all",
        "placeholder:text-slate-400",
        "hover:border-slate-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60",
        className,
      ].join(" ")}
      {...props}
    />
  ),
);
Input.displayName = "Input";
