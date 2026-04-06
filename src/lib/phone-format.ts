/** 휴대폰 번호 입력용: 숫자만 받아 010-1234-5678 형태로 표시 (최대 11자리) */
export function formatKoreanMobileInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
