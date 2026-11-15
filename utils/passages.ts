// Memorised passages: runs of consecutive bookmarked verses. The "skip" buttons on
// the surah page move between passages instead of between single verses.

export interface Passage {
  /** Index of the first verse in the surah's verse list. */
  start: number;
  /** Index of the last verse (inclusive). */
  end: number;
}

/** Groups verse indices into runs of consecutive indices, in order. */
export function groupPassages(indices: number[]): Passage[] {
  const sorted = [...new Set(indices)].sort((a, b) => a - b);
  const out: Passage[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i === last.end + 1) last.end = i;
    else out.push({ start: i, end: i });
  }
  return out;
}

export interface ViewState {
  /** Index of the first verse currently visible. */
  top: number;
  /** Index of the last verse currently visible. */
  bottom: number;
  /** Passage the user last jumped to, if any. */
  lastJumped: number | null;
}

/**
 * Passage to jump to from the current view; wraps around at both ends.
 *
 * If the last jumped-to passage is still on screen it is the reference, so repeated
 * presses walk through the passages even when the list cannot scroll far enough to put
 * a passage at the top (the end of a surah). Otherwise the reference is the screen
 * itself: "next" is the first passage starting below the first visible verse, and
 * "previous" the last one starting above it (which is the start of the passage you
 * are in the middle of).
 */
export function stepPassage(passages: Passage[], view: ViewState, direction: 1 | -1): number {
  const n = passages.length;
  if (n === 0) return -1;
  const { top, bottom, lastJumped } = view;
  if (lastJumped !== null && lastJumped >= 0 && lastJumped < n) {
    const s = passages[lastJumped].start;
    if (s >= top && s <= bottom) return (lastJumped + direction + n) % n;
  }
  if (direction === 1) {
    const next = passages.findIndex((p) => p.start > top);
    return next === -1 ? 0 : next;
  }
  for (let i = n - 1; i >= 0; i--) if (passages[i].start < top) return i;
  return n - 1;
}
