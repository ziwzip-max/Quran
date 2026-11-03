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

// --- Rules on the app's own Uthmani text -----------------------------------
// In this script a noon / meem that is not pronounced clearly has no sukun:
// a bare letter for idgham and ikhfa, or a small high meem (U+06E2) for iqlab.

/** Rule on the first `letter` (a bare base letter) of word number `wordIndex` (split on spaces) of a verse. */
function ruleAt(surah: number, ayah: number, wordIndex: number, letter: string): TajweedRule | null {
  const text = SURAHS[surah - 1].verses[ayah - 1].text;
  const words = text.split(" ");
  const wordAt = words.slice(0, wordIndex).reduce((n, w) => n + w.length + 1, 0);
  const at = text.indexOf(letter, wordAt);
  assert.ok(at >= wordAt && at < wordAt + words[wordIndex].length, `"${letter}" not in "${words[wordIndex]}"`);
  let pos = 0;
  for (const seg of parseTajweed(text)) {
    if (at < pos + seg.text.length) return seg.rule;
    pos += seg.text.length;
  }
  return null;
}

test("Uthmani: bare noon before ra is idgham without ghunna (2:5 مِّن رَّبِّهِمْ)", () => {
  assert.equal(ruleAt(2, 5, 3, "ن"), "idgham_bila_ghunna");
});

test("Uthmani: bare noon before ya is idgham with ghunna (2:8 مَن يَقُولُ)", () => {
  assert.equal(ruleAt(2, 8, 2, "ن"), "idgham_ghunna");
});

test("Uthmani: noon with small high meem before ba is iqlab (2:27 مِنۢ بَعْدِ)", () => {
  assert.equal(ruleAt(2, 27, 4, "ن"), "iqlab");
});

test("Uthmani: bare noon inside a word is ikhfa (2:22 وَأَنتُمْ)", () => {
  assert.equal(ruleAt(2, 22, 22, "ن"), "ikhfa");
});

test("Uthmani: bare meem before ba is ikhfa shafawi (2:8 هُم بِمُؤْمِنِينَ)", () => {
  assert.equal(ruleAt(2, 8, 9, "م"), "qalb");
});

test("Uthmani: noon with sukun is clear, no rule (2:74 مِنْهُ)", () => {
  assert.equal(ruleAt(2, 74, 17, "ن"), null);
});

test("no idgham inside one word: ٱلدُّنْيَا, بُنْيَٰن, صِنْوَان, قِنْوَان", () => {
  for (const s of SURAHS) {
    for (const v of s.verses) {
      for (const word of v.text.split(" ")) {
        const segs = parseTajweed(word);
        const i = segs.findIndex((g) => g.rule?.startsWith("idgham") && g.text.startsWith("ن"));
        const lettersAfter = i >= 0 && segs.slice(i + 1).some((g) => /\p{L}/u.test(g.text));
        assert.ok(!lettersAfter, `in-word idgham in "${word}" (${s.number}:${v.number})`);
      }
    }
  }
});

test("Hafs exceptions stay clear: Nun in 68:1 and the sakt in 75:27", () => {
  assert.equal(ruleAt(68, 1, 4, "ن"), null);
  assert.equal(ruleAt(75, 27, 1, "ن"), null);
});

test("pause signs between words do not block the rule (2:74 قَسْوَةًۭ ۚ وَإِنَّ)", () => {
  assert.equal(ruleAt(2, 74, 10, "ة"), "idgham_ghunna");
});
