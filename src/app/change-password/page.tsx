import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ChangePasswordForm } from "./change-password-form";

function Fallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <h1 className="mb-6 text-xl font-bold text-slate-900">비밀번호 변경</h1>
      <Suspense fallback={<Fallback />}>
        <ChangePasswordForm />
      </Suspense>
    </div>
  );
}
