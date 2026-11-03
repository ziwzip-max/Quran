import { test } from "node:test";
import assert from "node:assert/strict";
import { highlightWords, normalizeQuery, searchVerses, textMatches } from "@/utils/arabicSearch";
import { SURAHS } from "@/constants/quranData";
import { verseShareText } from "@/utils/verseText";

const verse = (s: number, a: number) => SURAHS[s - 1].verses[a - 1].text;
const refs = (q: string) => searchVerses(q).map((h) => `${h.surahNumber}:${h.verseNumber}`);

test("typed words match the vowelled Uthmani text", () => {
  assert.ok(textMatches(verse(1, 3), "الرحمن"));
  assert.ok(textMatches(verse(1, 2), "الحمد لله"));
  assert.ok(textMatches(verse(2, 2), "الكتاب"), "dagger alif read as alif");
  assert.ok(textMatches(verse(2, 3), "الصلاة"), "صلوٰة spelled صلاة");
  assert.ok(textMatches(verse(2, 3), "يؤمنون"));
  assert.ok(textMatches(verse(2, 6), "ءأنذرتهم") || textMatches(verse(2, 6), "أأنذرتهم"));
});

test("letter variants are folded", () => {
  assert.equal(normalizeQuery("إِنَّ ٱللَّهَ"), "ان الله");
  assert.equal(normalizeQuery("موسى"), normalizeQuery("موسي"));
  assert.equal(normalizeQuery("رحمة"), normalizeQuery("رحمه"));
});

test("finds well-known verses", () => {
  assert.ok(refs("الحمد لله رب العالمين").includes("1:2"));
  assert.ok(refs("الله لا اله الا هو الحي القيوم").includes("2:255"));
  assert.ok(refs("قل هو الله احد").includes("112:1"));
});

test("returns every match, not just the first 30", () => {
  assert.ok(searchVerses("الله").length > 1000);
});

test("ignores queries that are too short", () => {
  assert.deepEqual(searchVerses("ا"), []);
});

test("highlights the matching words", () => {
  const hits = highlightWords(verse(1, 2), "رب").filter((w) => w.hit).map((w) => w.text);
  assert.equal(hits.length, 1);
  assert.ok(hits[0].startsWith("رَ"));
});

test("shared verse text ends with the reference", () => {
  assert.equal(verseShareText(" نص الآية ", "سُورَةُ البَقَرَةِ", 2, 255), "نص الآية\n\n— البَقَرَةِ 2:255");
});
