/**
 * Telegram 동기화 — 서버 로직 의사코드 (Supabase DB Insert 시 알림)
 *
 * // 예: Next.js Route Handler 또는 Supabase Edge Function
 * //
 * // import { createClient } from '@supabase/supabase-js'
 * //
 * // export async function onTaskInserted(record: TaskRow) {
 * //   const botToken = await getCompanyTelegramToken(record.company_id)
 * //   const channelId = await getCompanyTelegramChannel(record.company_id)
 * //   if (!botToken || !channelId) return
 * //
 * //   await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
 * //     method: 'POST',
 * //     headers: { 'Content-Type': 'application/json' },
 * //     body: JSON.stringify({
 * //       chat_id: channelId,
 * //       text: `[업무] ${record.title} 이(가) 접수되었습니다.`,
 * //     }),
 * //   })
 * // }
 * //
 * // Supabase: Database Webhook → Edge Function URL 로 POST 하거나,
 * // Realtime 구독 대신 서버에서만 시크릿 키로 Telegram 호출할 것.
 */

export const TELEGRAM_SYNC_NOTES =
  "See inline JSDoc in src/lib/telegram-sync.ts for pseudo-code.";
