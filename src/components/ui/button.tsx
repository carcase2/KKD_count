import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-blue-600 border border-blue-700/30",
  secondary:
    "bg-white text-slate-800 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-700 hover:bg-slate-100 border border-transparent",
  danger:
    "bg-gradient-to-b from-red-600 to-red-700 text-white shadow-md shadow-red-600/20 hover:from-red-500 hover:to-red-600 border border-red-800/20",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className = "", variant = "primary", type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={[
      "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-all duration-200",
      "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
      variants[variant],
      className,
    ].join(" ")}
    {...props}
  />
));
Button.displayName = "Button";
