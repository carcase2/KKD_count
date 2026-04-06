import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SignupForm } from "./signup-form";

function SignupFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <Suspense fallback={<SignupFallback />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
