import { test } from "node:test";
import assert from "node:assert/strict";
import { surahsInJuz } from "@/utils/quranIndex";

test("Juz 1 is Al-Fatiha and the start of Al-Baqarah", () => {
  assert.deepEqual(surahsInJuz(1), [1, 2]);
});

test("Al-Baqarah spans Juz 1 to 3", () => {
  for (const j of [1, 2, 3]) assert.ok(surahsInJuz(j).includes(2), `juz ${j}`);
  assert.ok(!surahsInJuz(4).includes(2));
});

test("Juz 30 is An-Naba to An-Nas", () => {
  const j30 = surahsInJuz(30);
  assert.equal(j30[0], 78);
  assert.equal(j30[j30.length - 1], 114);
  assert.equal(j30.length, 37);
});

test("every surah is in at least one Juz", () => {
  const seen = new Set<number>();
  for (let j = 1; j <= 30; j++) surahsInJuz(j).forEach((s) => seen.add(s));
  assert.equal(seen.size, 114);
});
