import { test } from "node:test";
import assert from "node:assert/strict";
import { SURAHS } from "@/constants/quranData";

test("has all 114 surahs, numbered in order", () => {
  assert.equal(SURAHS.length, 114);
  SURAHS.forEach((s, i) => assert.equal(s.number, i + 1));
});

test("has 6236 verses in total, numbered from 1 within each surah", () => {
  let total = 0;
  for (const s of SURAHS) {
    s.verses.forEach((v, i) => assert.equal(v.number, i + 1, `surah ${s.number} verse ${i + 1}`));
    total += s.verses.length;
  }
  assert.equal(total, 6236);
});

test("no verse is empty", () => {
  for (const s of SURAHS) {
    for (const v of s.verses) assert.ok(v.text.trim().length > 0, `surah ${s.number}:${v.number}`);
  }
});

test("surah names avoid U+06E1, which most fonts cannot draw", () => {
  const bad = SURAHS.filter((s) => s.nameArabic.includes("ۡ")).map((s) => s.number);
  assert.deepEqual(bad, []);
});
