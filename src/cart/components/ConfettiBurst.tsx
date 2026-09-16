import { motion } from 'framer-motion';

/** Brand green, a lighter green, the gold accent and the coupon purple. */
const COLORS = ['#039855', '#7BE0AC', '#D89324', '#8020B4'];
const COUNT = 14;
/** Long enough to register. Under ~0.8s the burst is over before it is seen. */
const DURATION = 0.95;
/** Fast out, long settle — a burst should leave quickly and drift to a stop. */
const BURST_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Particles are derived from their index, never from Math.random().
 *
 * A random layout would reshuffle on every re-render mid-flight, and two
 * coupons bursting at once would look unrelated rather than like one system.
 * Index-derived angles also guarantee an even spread, which random never does
 * at fourteen particles.
 */
const PARTICLES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + (i % 2 ? 0.26 : -0.18);
  const distance = 26 + (i % 4) * 8;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    color: COLORS[i % COLORS.length],
    rotate: (i % 2 ? 1 : -1) * (140 + i * 18),
    size: i % 3 === 0 ? 8 : 6,
    round: i % 3 === 1,
    delay: (i % 5) * 0.012,
  };
});

/**
 * A one-shot burst radiating from its parent's centre.
 *
 * Two details do the heavy lifting for legibility. Opacity holds at 1 for the
 * first half rather than fading linearly — a particle that starts fading
 * immediately is faintest exactly when it is furthest out and most visible.
 * And each one falls ~12px past its peak, so the burst decelerates and settles
 * instead of stopping dead.
 */
export function ConfettiBurst({ burstKey }: { burstKey: string | number }) {
  return (
    <span className="confetti" aria-hidden="true">
      {/* Soft flash behind the check, so the eye is drawn before the particles
          have travelled far enough to be noticed on their own. */}
      <motion.span
        key={`${burstKey}-flash`}
        className="confetti__flash"
        initial={{ scale: 0.4, opacity: 0.42 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.5, ease: BURST_EASE }}
      />

      {PARTICLES.map((p) => (
        <motion.span
          key={`${burstKey}-${p.id}`}
          className="confetti__bit"
          style={{
            background: p.color,
            width: p.size,
            height: p.size,
            borderRadius: p.round ? '50%' : 1,
          }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: [0, p.y, p.y + 12],
            scale: [0.2, 1, 0.9],
            opacity: [1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: DURATION,
            ease: BURST_EASE,
            times: [0, 0.5, 1],
            delay: p.delay,
          }}
        />
      ))}
    </span>
  );
}
