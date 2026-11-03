import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countDueBlocks,
  countDueVerses,
  isDueForReview,
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

test("countDueBlocks counts only due entries", () => {
  const mastery = { a: 0, b: 1, c: 2, d: 3 };
  const reviews = { b: NOW, c: NOW - REVIEW_THRESHOLD_L2 - 1 };
  // a: not started; b: just reviewed; c: overdue; d: never reviewed
  assert.equal(countDueBlocks(mastery, reviews, NOW), 2);
});

test("countDueVerses counts verses below full mastery", () => {
  assert.equal(countDueVerses({ "1:1": 0, "1:2": 1, "1:3": 2, "1:4": 3 }), 3);
  assert.equal(countDueVerses({}), 0);
});
