import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTajweed, type TajweedRule } from "@/utils/tajweed";
import { SURAHS } from "@/constants/quranData";

function rules(text: string): [string, TajweedRule][] {
  return parseTajweed(text)
    .filter((s): s is { text: string; rule: TajweedRule } => s.rule !== null)
    .map((s) => [s.text, s.rule]);
}

test("segments always join back into the original text", () => {
  for (const s of SURAHS.slice(0, 10)) {
    for (const v of s.verses) {
      assert.equal(parseTajweed(v.text).map((seg) => seg.text).join(""), v.text, `surah ${s.number}:${v.number}`);
    }
  }
});

test("ghunna on doubled noon and meem", () => {
  assert.deepEqual(rules("إِنَّ"), [["نَّ", "ghunna"]]);
  assert.deepEqual(rules("ثُمَّ"), [["مَّ", "ghunna"]]);
});

test("qalqala on a qalqala letter with sukun", () => {
  assert.deepEqual(rules("يَخْلُقْ"), [["قْ", "qalqala"]]);
});

test("noon sakin rules look at the first letter of the next word", () => {
  assert.deepEqual(rules("مِنْ بَعْدِ"), [["نْ", "iqlab"]]);
  assert.deepEqual(rules("مَنْ يَقُولُ").filter(([, r]) => r !== "madd_normal"), [["نْ", "idgham_ghunna"]]);
  assert.deepEqual(rules("أَنْ تَقُولَ").filter(([, r]) => r !== "madd_normal"), [["نْ", "ikhfa"]]);
});

test("noon sakin rules still apply inside a word", () => {
  assert.deepEqual(rules("يَنْصُرُ"), [["نْ", "ikhfa"]]);
});

test("tanwin rules skip the silent alif and the space", () => {
  assert.ok(rules("سَمِيعٌ بَصِيرٌ").some(([t, r]) => t === "عٌ" && r === "iqlab"));
  // ha is a throat letter (izhar): no nasal rule on the tanwin
  assert.ok(!rules("عَلِيمًا حَكِيمًا").some(([t]) => t === "مً"));
});

test("meem sakin before ba (ikhfa shafawi)", () => {
  assert.deepEqual(rules("هُمْ بِهِ"), [["مْ", "qalb"]]);
});

test("hamzat wasl and lam shamsiyya", () => {
  assert.deepEqual(rules("ٱلشَّمْسِ"), [["ٱ", "hamzat_wasl"], ["ل", "lam_shamsiyya"]]);
});
