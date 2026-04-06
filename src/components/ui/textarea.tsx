import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={[
      "flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm transition-all",
      "placeholder:text-slate-400",
      "hover:border-slate-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25",
      className,
    ].join(" ")}
    {...props}
  />
));
Textarea.displayName = "Textarea";
