/** 한국 표준시(Asia/Seoul) 기준 날짜·시간 문자열 (UI 표시용) */
export function formatDateTimeKst(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}
