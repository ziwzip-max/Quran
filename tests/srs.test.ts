import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countDueVerses,
  averageLevel,
  dueBlocks,
  isDueForReview,
  levelAfterReview,
  reviewTimeAfter,
  REVIEW_THRESHOLD_L1,
  REVIEW_THRESHOLD_L2,
  REVIEW_THRESHOLD_L3,
} from "@/utils/srs";

const NOW = 1_800_000_000_000;

test("items never reviewed are due unless not started", () => {
  assert.equal(isDueForReview("a", {}, 0, NOW), false);
  assert.equal(isDueForReview("a", {}, 1, NOW), true);
  assert.equal(isDueForReview("a", {}, 3, NOW), true);
});

test("each level becomes due only after its interval", () => {
  const cases: [number, number][] = [
    [1, REVIEW_THRESHOLD_L1],
    [2, REVIEW_THRESHOLD_L2],
    [3, REVIEW_THRESHOLD_L3],
  ];
  for (const [level, threshold] of cases) {
    assert.equal(isDueForReview("a", { a: NOW - threshold }, level, NOW), false, `level ${level} at threshold`);
    assert.equal(isDueForReview("a", { a: NOW - threshold - 1 }, level, NOW), true, `level ${level} past threshold`);
  }
});

test("intervals grow with mastery", () => {
  assert.ok(REVIEW_THRESHOLD_L1 < REVIEW_THRESHOLD_L2);
  assert.ok(REVIEW_THRESHOLD_L2 < REVIEW_THRESHOLD_L3);
});

test("dueBlocks counts blocks, with per-verse levels and per-block review dates", () => {
  const block = (s: number, from: number, to: number) => ({
    id: `${s}:${from}-${to}`,
    surahNumber: s,
    verses: Array.from({ length: to - from + 1 }, (_, i) => ({ number: from + i })),
  });
  const blocks = [block(2, 1, 3), block(2, 10, 11), block(3, 5, 5), block(4, 1, 2)];
  const mastery = {
    "2:1": 3, "2:2": 3, "2:3": 3, // level 3, reviewed recently → not due
    "2:10": 1, "2:11": 1, // level 1, never reviewed → due
    "3:5": 2, // level 2, overdue → due
    // 4:1-2 not started → never due
  };
  const reviews = { "2:1-3": NOW - REVIEW_THRESHOLD_L1, "3:5-5": NOW - REVIEW_THRESHOLD_L2 - 1 };
  assert.deepEqual(dueBlocks(blocks, mastery, reviews, NOW).map((b) => b.id), ["2:10-11", "3:5-5"]);
  // Before the fix the home screen counted verses (here 6 with a level) instead of blocks.
  assert.equal(dueBlocks(blocks, mastery, reviews, NOW).length, 2);
});

test("countDueVerses counts verses below full mastery", () => {
  assert.equal(countDueVerses({ "1:1": 0, "1:2": 1, "1:3": 2, "1:4": 3 }), 3);
  assert.equal(countDueVerses({}), 0);
});


test("guided review ratings move the level", () => {
  assert.equal(levelAfterReview(3, "forgot"), 1);
  assert.equal(levelAfterReview(0, "hard"), 1);
  assert.equal(levelAfterReview(2, "hard"), 2);
  assert.equal(levelAfterReview(1, "good"), 2);
  assert.equal(levelAfterReview(3, "good"), 3);
});

test("a forgotten block is due again the next day, not in three days", () => {
  const t = reviewTimeAfter("forgot", NOW);
  const DAY = 24 * 60 * 60 * 1000;
  assert.equal(isDueForReview("a", { a: t }, 1, NOW + DAY - 1), false);
  assert.equal(isDueForReview("a", { a: t }, 1, NOW + DAY + 1), true);
  assert.equal(reviewTimeAfter("good", NOW), NOW);
});

test("averageLevel rounds and handles empty blocks", () => {
  assert.equal(averageLevel([]), 0);
  assert.equal(averageLevel([1, 2, 2]), 2);
});
