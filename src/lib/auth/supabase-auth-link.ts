import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type EnsureAuthLinkInput = {
  accountId: string;
  companyId: string;
  username: string;
  password: string;
  displayName: string | null;
  role: "admin" | "user";
};

function buildAuthEmail(accountId: string) {
  return `acct-${accountId}@intranet.local`;
}

/**
 * intranet_accounts <-> auth.users 매핑 보장
 * - 서비스키 미설정 시 무해하게 스킵
 * - 실패해도 기존 커스텀 로그인 흐름은 유지
 */
export async function ensureSupabaseAuthLink(input: EnsureAuthLinkInput): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const email = buildAuthEmail(input.accountId);

  const { data: account } = await admin
    .from("intranet_accounts")
    .select("auth_user_id")
    .eq("id", input.accountId)
    .maybeSingle();

  if (account?.auth_user_id) return;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      intranet_account_id: input.accountId,
      company_id: input.companyId,
      username: input.username,
      role: input.role,
      display_name: input.displayName,
    },
  });

  if (createError || !created.user) {
    console.error("[ensureSupabaseAuthLink:createUser]", createError?.message ?? "unknown");
    return;
  }

  const { error: updError } = await admin
    .from("intranet_accounts")
    .update({ auth_user_id: created.user.id })
    .eq("id", input.accountId);

  if (updError) {
    console.error("[ensureSupabaseAuthLink:updateAccount]", updError.message);
  }
}
