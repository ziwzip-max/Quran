import { test } from "node:test";
import assert from "node:assert/strict";
import { groupPassages, stepPassage } from "@/utils/passages";

// Al-Isra in the real backup: verses 9–15, 23–30 and 78–85 (indices are verse − 1).
const idx = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i);
const isra = groupPassages([...idx(78, 85), ...idx(9, 15), ...idx(23, 30)]);

test("groups consecutive verses into passages, in order", () => {
  assert.deepEqual(isra, [
    { start: 8, end: 14 },
    { start: 22, end: 29 },
    { start: 77, end: 84 },
  ]);
  assert.deepEqual(groupPassages([]), []);
  assert.deepEqual(groupPassages([3, 3, 4]), [{ start: 3, end: 4 }]);
});

test("next jumps to the following passage, not the next verse", () => {
  const view = { top: 0, bottom: 5, lastJumped: null };
  assert.equal(stepPassage(isra, view, 1), 0);
  assert.equal(stepPassage(isra, { top: 8, bottom: 12, lastJumped: 0 }, 1), 1);
  assert.equal(stepPassage(isra, { top: 22, bottom: 26, lastJumped: 1 }, 1), 2);
});

test("wraps around at both ends", () => {
  assert.equal(stepPassage(isra, { top: 77, bottom: 81, lastJumped: 2 }, 1), 0);
  assert.equal(stepPassage(isra, { top: 8, bottom: 12, lastJumped: 0 }, -1), 2);
  assert.equal(stepPassage(isra, { top: 0, bottom: 4, lastJumped: null }, -1), 2);
});

test("from the middle of a passage, previous goes to its start", () => {
  assert.equal(stepPassage(isra, { top: 25, bottom: 29, lastJumped: null }, -1), 1);
  assert.equal(stepPassage(isra, { top: 25, bottom: 29, lastJumped: null }, 1), 2);
});

test("after the user scrolls away, the screen is the reference", () => {
  // Last jump was passage 0, but the user scrolled down to verses 50–55.
  assert.equal(stepPassage(isra, { top: 49, bottom: 54, lastJumped: 0 }, 1), 2);
  assert.equal(stepPassage(isra, { top: 49, bottom: 54, lastJumped: 0 }, -1), 1);
});

test("a passage at the very end of a surah does not trap the next button", () => {
  // The list cannot scroll far enough to put verse 84's passage at the top: top < start.
  const end = groupPassages([...idx(1, 3), ...idx(80, 85)]);
  const view = { top: 72, bottom: 84, lastJumped: 1 };
  assert.equal(stepPassage(end, view, 1), 0);
  assert.equal(stepPassage(end, view, -1), 0);
});

test("no passages", () => {
  assert.equal(stepPassage([], { top: 0, bottom: 3, lastJumped: null }, 1), -1);
});
