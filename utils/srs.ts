// Spaced-repetition rules shared by the home screen, the memorisation tab and
// the daily reminder. Pure functions (no React Native imports) so they can be
// unit-tested under Node.
import type { MasteryLevel } from "@/contexts/MasteryContext";

const DAY = 24 * 60 * 60 * 1000;

/** How long after a review each mastery level becomes due again. */
export const REVIEW_THRESHOLD_L1 = 3 * DAY;
export const REVIEW_THRESHOLD_L2 = 7 * DAY;
export const REVIEW_THRESHOLD_L3 = 30 * DAY;

/**
 * Whether an item at `masteryLevel` is due for review.
 * Level 0 (not started) is never due; a started item with no recorded review is due.
 */
export function isDueForReview(
  id: string,
  reviews: Record<string, number>,
  masteryLevel: number,
  now: number = Date.now(),
): boolean {
  const lastReview = reviews[id];
  if (lastReview === undefined) return masteryLevel > 0;
  const elapsed = now - lastReview;
  if (masteryLevel === 1) return elapsed > REVIEW_THRESHOLD_L1;
  if (masteryLevel === 2) return elapsed > REVIEW_THRESHOLD_L2;
  if (masteryLevel === 3) return elapsed > REVIEW_THRESHOLD_L3;
  return false;
}

/** Number of entries in `masteryMap` that are due, given their last review times. */
export function countDueBlocks(
  masteryMap: Record<string, number>,
  reviews: Record<string, number>,
  now: number = Date.now(),
): number {
  return Object.entries(masteryMap).filter(([key, level]) => isDueForReview(key, reviews, level, now)).length;
}

/** Verses still being memorised (below the top level), used for the daily reminder text. */
export function countDueVerses(masteryMap: Record<string, MasteryLevel>): number {
  return Object.values(masteryMap).filter((level) => level < 3).length;
}

export type ReviewRating = "forgot" | "hard" | "good";

/** New mastery level after a guided review: forgot → 1, hard → same (at least 1), good → one up (max 3). */
export function levelAfterReview(level: number, rating: ReviewRating): MasteryLevel {
  if (rating === "forgot") return 1;
  if (rating === "hard") return Math.max(1, Math.min(3, level)) as MasteryLevel;
  return Math.max(1, Math.min(3, level + 1)) as MasteryLevel;
}

/**
 * Review time to store after a guided review. A forgotten block is stored as if
 * reviewed earlier, so it comes back tomorrow instead of in three days.
 */
export function reviewTimeAfter(rating: ReviewRating, now: number = Date.now()): number {
  return rating === "forgot" ? now - REVIEW_THRESHOLD_L1 + DAY : now;
}

/** Rounded average mastery of a block's verses. */
export function averageLevel(levels: number[]): number {
  if (levels.length === 0) return 0;
  return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
}
