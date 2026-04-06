import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
