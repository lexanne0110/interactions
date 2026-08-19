import { carouselCommitDragX } from './expandOrigin';

/** Commit on distance alone once dragged this far. */
const COMMIT_MIN_PX = 56;

/** A flick commits below COMMIT_MIN_PX, but only past this much travel — without it a
 *  2px jitter over a 4ms frame reads as ~500px/s and commits by accident. */
const FLICK_VELOCITY = 600;
const FLICK_MIN_PX = 24;

/** Resistance when pulling past the first/last item. */
const EDGE_RUBBER_BAND = 0.32;

/** Velocity samples older than this are dropped before averaging. */
const VELOCITY_WINDOW_MS = 80;

/** Samples closer together than this have too little travel to be meaningful. */
const MIN_SAMPLE_DT_MS = 8;

export type VelocitySample = { x: number; t: number };

/**
 * Windowed pointer velocity in px/s.
 *
 * A single-sample derivative (dx/dt of the last move alone) is unusable here: browsers
 * can deliver two moves 3-4ms apart, so a couple of pixels of hand tremor produces a
 * reading in the hundreds of px/s. Averaging over a short trailing window smooths that
 * out while still tracking a genuine flick.
 */
export function createVelocityTracker() {
  let samples: VelocitySample[] = [];

  return {
    reset() {
      samples = [];
    },
    add(x: number, t: number) {
      const last = samples[samples.length - 1];
      if (last && t - last.t < MIN_SAMPLE_DT_MS) return;
      samples.push({ x, t });
      const cutoff = t - VELOCITY_WINDOW_MS;
      samples = samples.filter((s) => s.t >= cutoff);
    },
    /** px/s across the retained window; 0 when there is not enough signal. */
    velocity(): number {
      if (samples.length < 2) return 0;
      const first = samples[0]!;
      const last = samples[samples.length - 1]!;
      const dt = last.t - first.t;
      if (dt <= 0) return 0;
      return ((last.x - first.x) / dt) * 1000;
    },
  };
}

export function carouselSnapDistance(fromIndex: number, toIndex: number, total: number) {
  return carouselCommitDragX(fromIndex, toIndex, total);
}

/** Apply rubber-band resistance when dragging beyond available neighbors. */
export function rubberBandDragX(
  dragX: number,
  index: number,
  total: number,
): number {
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  if (dragX > 0 && !hasPrev) {
    return dragX * EDGE_RUBBER_BAND;
  }
  if (dragX < 0 && !hasNext) {
    return dragX * EDGE_RUBBER_BAND;
  }
  return dragX;
}

export type SwipeCommit = 'prev' | 'next' | null;

/**
 * Decide whether release should snap to prev/next or spring back.
 *
 * Commits on distance alone (>= COMMIT_MIN_PX), or on a flick — but a flick must also
 * have travelled FLICK_MIN_PX, so a fast twitch that goes nowhere always springs back.
 *
 * The old `snap * 0.3` term is gone: every travel is one 330px stride, so it evaluated
 * to +/-99px and was always dominated by the 56px distance test. It never decided anything.
 */
export function resolveSwipeCommit(
  dragX: number,
  velocityX: number,
  index: number,
  total: number,
): SwipeCommit {
  const hasPrev = index > 0;
  const hasNext = index < total - 1;
  const flicked = Math.abs(dragX) >= FLICK_MIN_PX;

  if (hasNext && (dragX <= -COMMIT_MIN_PX || (flicked && velocityX <= -FLICK_VELOCITY))) {
    return 'next';
  }

  if (hasPrev && (dragX >= COMMIT_MIN_PX || (flicked && velocityX >= FLICK_VELOCITY))) {
    return 'prev';
  }

  return null;
}

/** Target track offset after a committed swipe (before product swap). */
export function commitTrackX(
  fromIndex: number,
  toIndex: number,
  total: number,
): number {
  return carouselSnapDistance(fromIndex, toIndex, total);
}
