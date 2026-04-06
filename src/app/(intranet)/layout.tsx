import type { ReactNode } from "react";
import { IntranetBoot } from "@/components/auth/intranet-boot";
import { MustChangePasswordModal } from "@/components/auth/must-change-password-modal";
import { AppShell } from "@/components/layout/app-shell";
import { AppStateProvider } from "@/context/app-state";
import { AuthProvider } from "@/context/auth-context";

export default function IntranetLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <IntranetBoot>
        <AppStateProvider>
          <MustChangePasswordModal />
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </IntranetBoot>
    </AuthProvider>
  );
}
