/**
 * "N آية" with the right Arabic number agreement: 1 آية, 2 آيتان, 3–10 آيات, 11 and more آية.
 */
export function countAyat(n: number): string {
  if (n === 2) return "آيتان";
  if (n >= 3 && n <= 10) return `${n} آيات`;
  return `${n} آية`;
}
