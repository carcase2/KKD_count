/** 부서 색이 없을 때 UI 기본값 */
export const FALLBACK_DEPARTMENT_COLOR = "#64748b";

/** 새 부서 추가 시 순환하는 팔레트 */
export const NEW_DEPARTMENT_PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
];

export function pickNewDepartmentColor(index: number): string {
  return NEW_DEPARTMENT_PALETTE[index % NEW_DEPARTMENT_PALETTE.length] ?? FALLBACK_DEPARTMENT_COLOR;
}

/** #RGB / #RRGGBB 정규화. 잘못된 값이면 기본색 */
export function normalizeDepartmentColor(input: string | null | undefined): string | null {
  if (input == null) return null;
  let s = input.trim();
  if (s === "") return null;
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return FALLBACK_DEPARTMENT_COLOR;
}
