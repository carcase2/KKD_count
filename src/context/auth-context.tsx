"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/types";

export type AuthSession = {
  id: string;
  company_id: string;
  role: UserRole;
  username: string;
  display_name: string | null;
  department_id: string | null;
  phone: string | null;
  login_enabled: boolean;
  must_change_password: boolean;
};

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  supabase: ReturnType<typeof createBrowserSupabaseClient>;
  session: AuthSession | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => (configured ? createBrowserSupabaseClient() : null), [configured]);

  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refreshSession = useCallback(async () => {
    if (!configured) {
      setSession(null);
      return;
    }
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      setSession(null);
      return;
    }
    const json = (await res.json()) as {
      session: {
        id: string;
        company_id: string;
        role: string;
        username: string;
        display_name: string | null;
        department_id?: string | null;
        phone?: string | null;
        login_enabled?: boolean;
        must_change_password?: boolean;
      } | null;
    };
    const s = json.session;
    if (!s) {
      setSession(null);
      return;
    }
    setSession({
      id: s.id,
      company_id: s.company_id,
      role: s.role === "admin" ? "admin" : "user",
      username: s.username,
      display_name: s.display_name,
      department_id: s.department_id ?? null,
      phone: s.phone ?? null,
      login_enabled: s.login_enabled !== false,
      must_change_password: s.must_change_password === true,
    });
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let cancelled = false;
    void (async () => {
      await refreshSession();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, refreshSession]);

  const signOutStable = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      supabase,
      session,
      refreshSession,
      signOut: signOutStable,
    }),
    [configured, loading, supabase, session, refreshSession, signOutStable],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
