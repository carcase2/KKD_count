"use client";

import { 
  type ReactNode, 
  useState, 
  useMemo, 
  createContext, 
  useContext, 
  useEffect, 
  useRef 
} from "react";
import { ChevronDown, Check } from "lucide-react";

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: ReactNode;
  setSelectedLabel: (label: ReactNode) => void;
};

const SelectContext = createContext<SelectContextType | null>(null);

export function Select({ 
  children, 
  value, 
  onValueChange 
}: { 
  children: ReactNode; 
  value: string; 
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<ReactNode>(null);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ctx = useContext(SelectContext);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => ctx?.setOpen(!ctx.open)}
      className={`flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${ctx?.open ? "rotate-180" : ""}`} />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext);
  return <span className={!ctx?.value ? "text-slate-400" : ""}>{ctx?.selectedLabel || placeholder}</span>;
}

export function SelectContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ctx = useContext(SelectContext);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        ctx?.setOpen(false);
      }
    };
    if (ctx?.open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ctx]);

  if (!ctx?.open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute top-full z-50 mt-2 max-h-60 w-full min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl animate-in fade-in slide-in-from-top-2 ${className}`}
    >
      <div className="overflow-y-auto max-h-[inherit] custom-scrollbar">{children}</div>
    </div>
  );
}

export function SelectItem({ children, value, className = "" }: { children: ReactNode; value: string; className?: string }) {
  const ctx = useContext(SelectContext);
  const isSelected = ctx?.value === value;

  useEffect(() => {
    if (isSelected) {
      ctx?.setSelectedLabel(children);
    }
  }, [isSelected, children]);

  return (
    <button
      type="button"
      onClick={() => {
        ctx?.onValueChange(value);
        ctx?.setSelectedLabel(children);
        ctx?.setOpen(false);
      }}
      className={`relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-slate-50 focus:bg-slate-50 ${isSelected ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-700"} ${className}`}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </button>
  );
}
