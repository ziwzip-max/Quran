// Pure helpers (no React Native imports) so they can be unit-tested under Node.

/** Text shared for a verse: the verse, then its reference, e.g. "— البقرة 2:255". */
export function verseShareText(text: string, surahNameArabic: string, surahNum: number, verseNum: number): string {
  const name = surahNameArabic.replace(/^سُورَةُ\s*/u, "");
  return `${text.trim()}\n\n— ${name} ${surahNum}:${verseNum}`;
}
