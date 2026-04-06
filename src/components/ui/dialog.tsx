"use client";

import { 
  type ReactNode, 
  useEffect, 
  useState, 
  createContext, 
  useContext 
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type DialogContextType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function Dialog({ 
  children, 
  open, 
  onOpenChange 
}: { 
  children: ReactNode; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ctx = useContext(DialogContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (ctx?.open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [ctx?.open]);

  if (!mounted || !ctx?.open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => ctx.onOpenChange(false)} 
      />
      
      {/* Content */}
      <div 
        className={`relative w-full max-w-lg scale-100 rounded-3xl shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => ctx.onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-lg font-bold text-slate-900 leading-none tracking-tight ${className}`}>{children}</h2>;
}

export function DialogFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-end gap-2 p-6 bg-slate-50/50 rounded-b-3xl border-t border-slate-100 ${className}`}>{children}</div>;
}
