import { useEffect, useRef } from 'react';
import { createVelocityTracker } from '../lib/carouselDrag';

/** Below this a release is a tap, not a flick. */
const FLICK_MIN_VELOCITY = 200;
/** How much of the release velocity carries into momentum. */
const MOMENTUM = 0.22;
/** Past this much travel the gesture was a drag, so the click is suppressed. */
const DRAG_SLOP = 6;

/**
 * Drag-to-scroll for a horizontal rail.
 *
 * A phone swipes these rails; a mouse cannot scroll them sideways at all, so on
 * the dashboard the second coupon is unreachable without this. Velocity comes
 * from the existing carousel tracker — a windowed average, because a raw
 * dx/dt over a 3ms frame reads hand tremor as hundreds of px/s.
 *
 * Suppressing the click after a drag matters here specifically: these rails
 * contain APPLY buttons, and dragging across one must not apply the coupon.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let travelled = 0;
    const tracker = createVelocityTracker();

    const swallowClick = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      travelled = 0;
      tracker.reset();
      tracker.add(e.clientX, performance.now());
      el.classList.add('is-dragging');
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      travelled = Math.max(travelled, Math.abs(dx));
      if (travelled > DRAG_SLOP) el.setPointerCapture?.(e.pointerId);
      el.scrollLeft = startScroll - dx;
      tracker.add(e.clientX, performance.now());
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');

      const v = tracker.velocity();
      if (Math.abs(v) > FLICK_MIN_VELOCITY) {
        el.scrollBy({ left: -v * MOMENTUM, behavior: 'smooth' });
      }
      if (travelled > DRAG_SLOP) {
        el.addEventListener('click', swallowClick, { capture: true, once: true });
        // Nothing to swallow if the release was not over a control.
        window.setTimeout(() => el.removeEventListener('click', swallowClick, true), 0);
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return ref;
}
