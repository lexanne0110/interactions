import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cartAssets } from '../cartData';
import { Section } from './Section';
import { useDragScroll } from '../useDragScroll';
import { ConfettiBurst } from './ConfettiBurst';

/** House curve. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** The repo's snappy spring, used wherever something small confirms itself. */
const POP = { type: 'spring' as const, stiffness: 480, damping: 26 };

/**
 * Apply and remove are deliberately not mirror images.
 *
 * Applying is a commitment, so it gets the press, the success state and a
 * single ring pulse. Removing is an undo — it presses and returns to the
 * initial state with nothing celebrated, because there is nothing to celebrate.
 */
export type Coupon = {
  id: string;
  logo: string;
  title: string;
  code: string;
  saves: number;
  applied: boolean;
  /** Purple upsell shown under the rule while the coupon is unapplied. */
  nudge?: string;
};

export const seedCoupons: Coupon[] = [
  {
    id: 'nb2025',
    logo: cartAssets.couponNavi,
    title: 'Flat ₹20 off above ₹500',
    code: 'NB2025',
    saves: 20,
    applied: false,
    nudge: 'Add ₹6 more to get flat ₹25 off with NAVIUPI',
  },
  {
    id: 'axis10',
    logo: cartAssets.couponAxis,
    title: 'Flat ₹50 off above ₹999',
    code: 'AXIS50',
    saves: 50,
    applied: false,
    nudge: 'Add ₹6 more to get flat ₹25 off with NAVIUPI',
  },
];

const TagIcon = ({ applied = false }: { applied?: boolean }) => {
  const c = applied ? 'var(--c-green)' : '#8020b4';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8.6 1.7H3.4a1.7 1.7 0 0 0-1.7 1.7v5.2c0 .45.18.88.5 1.2l4.5 4.5a1.7 1.7 0 0 0 2.4 0l4-4a1.7 1.7 0 0 0 0-2.4l-4.5-4.5a1.7 1.7 0 0 0-1.2-.5Z"
        stroke={c}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="5.4" cy="5.4" r="0.9" fill={c} />
    </svg>
  );
};

type Props = {
  coupons: Coupon[];
  onApply?: (id: string) => void;
  onRemove?: (id: string) => void;
  onViewAll?: () => void;
};

export function CouponsCard({ coupons, onApply, onRemove, onViewAll }: Props) {
  const railRef = useDragScroll<HTMLDivElement>();
  /** Transient, so the ring fires on the act of applying — not on mount. */
  const [justApplied, setJustApplied] = useState<string | null>(null);

  const apply = (id: string) => {
    onApply?.(id);
    setJustApplied(id);
    window.setTimeout(() => setJustApplied((cur) => (cur === id ? null : cur)), 750);
  };

  return (
    <Section title="Coupons &amp; Offers">
      <div className="coupons__rail" ref={railRef}>
        {coupons.map((c) => (
          <article className="coupon-card" key={c.id}>
            {/* The ring is its own layer animating opacity and scale only.
                Pulsing the card's own box-shadow repaints the whole rail every
                frame, and the neighbouring card shimmers while it runs. */}
            <AnimatePresence>
              {justApplied === c.id && (
                <motion.span
                  className="coupon-card__ring"
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: [0, 1, 0], scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE, times: [0, 0.3, 1] }}
                />
              )}
            </AnimatePresence>

            <div className="coupon-card__top">
              <img className="coupon-card__logo" src={c.logo} alt="" />
              <span className="coupon-card__body">
                <span className="coupon-card__title">{c.title}</span>
                <span className="coupon-card__meta">
                  {c.applied
                    ? `${c.code} applied · You saved ₹${c.saves}`
                    : `${c.code} · You save ₹${c.saves}`}
                </span>
              </span>
              {/* Both states press. Crossfade in a fixed-width slot, since
                  APPLY and REMOVE differ in width and swapping them directly
                  would nudge the card's layout. */}
              <motion.button
                className="coupon-card__action"
                whileTap={{ scale: 0.9 }}
                transition={POP}
                onClick={() => (c.applied ? onRemove?.(c.id) : apply(c.id))}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={c.applied ? 'remove' : 'apply'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: EASE }}
                  >
                    {c.applied ? 'REMOVE' : 'APPLY'}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>

            <div className="coupon-card__rule" />

            {/* Nudge and applied strip share one slot, so the card never
                resizes when one replaces the other. */}
            <div className="coupon-card__slot">
              {c.nudge && (
                <div className="coupon-card__nudge" aria-hidden={c.applied}>
                  <TagIcon />
                  <span className="coupon-card__nudge-text">{c.nudge}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="#8020b4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <AnimatePresence initial={false}>
                {c.applied && (
                  <motion.div
                    className="coupon-card__applied"
                    /* The band no longer slides. It settles in place while the
                       check does the work, so nothing competes with the burst. */
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE } }}
                    transition={{ duration: 0.18, ease: EASE }}
                  >
                    <motion.span
                      className="coupon-card__check"
                      /* Press and release: the check compresses, then springs
                         past 1 as the confetti leaves it. */
                      initial={{ scale: 0.3 }}
                      animate={{ scale: [0.3, 0.86, 1] }}
                      transition={{ duration: 0.34, ease: EASE, times: [0, 0.45, 1] }}
                    >
                      {justApplied === c.id && <ConfettiBurst burstKey={c.id} />}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2.5 6.2 4.7 8.4 9.5 3.6" stroke="#ffffff" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.span>
                    Coupon Applied!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </article>
        ))}
      </div>

      <button className="cart-pill" onClick={onViewAll}>
        View All Coupons and Offers
      </button>
    </Section>
  );
}
