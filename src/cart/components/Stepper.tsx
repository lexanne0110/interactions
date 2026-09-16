import type { MouseEvent } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  stepperCountEnterTransition,
  stepperCountExitTransition,
  stepperTapTransition,
} from '../../lib/transitions';

const TAP_SCALE = 0.97;
/** Same travel as the category-listing stepper, so the two read as one control. */
const COUNT_TRAVEL = '65%';

type Direction = 'up' | 'down';

type Props = {
  value: number;
  onChange?: (next: number, prev: number) => void;
  /** Absolute placement inside .item-row__main is the default; opt out for other hosts. */
  inline?: boolean;
};

const countVariants = {
  enter: (d: Direction) => ({ y: d === 'up' ? COUNT_TRAVEL : `-${COUNT_TRAVEL}`, opacity: 0 }),
  center: { y: 0, opacity: 1, transition: stepperCountEnterTransition },
  exit: (d: Direction) => ({
    y: d === 'up' ? `-${COUNT_TRAVEL}` : COUNT_TRAVEL,
    opacity: 0,
    transition: stepperCountExitTransition,
  }),
};

/**
 * Quantity stepper — 87×32, radius 4, #e0f7eb.
 *
 * Motion is borrowed wholesale from `AddButtonStepper` (same travel, same count
 * transitions, same tap feedback) so the cart and the category listing do not
 * drift into two different-feeling controls.
 *
 * Unlike that stepper this one has no floor at 1: stepping down from 1 reaches
 * 0, which is the signal the row should be removed.
 */
export function Stepper({ value, onChange, inline = false }: Props) {
  const [direction, setDirection] = useState<Direction>('up');

  const step = (delta: number) => (e: MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(0, value + delta);
    if (next === value) return;
    setDirection(delta > 0 ? 'up' : 'down');
    onChange?.(next, value);
  };

  return (
    <div className="stepper" style={inline ? { position: 'relative', left: 0, top: 0 } : undefined}>
      <motion.button
        className="stepper__btn"
        onClick={step(-1)}
        whileTap={{ scale: TAP_SCALE }}
        transition={stepperTapTransition}
        aria-label="Decrease quantity"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6h7" stroke="var(--c-green)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.button>

      <span className="stepper__count-slot">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={value}
            className="stepper__count"
            custom={direction}
            variants={countVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>

      <motion.button
        className="stepper__btn"
        onClick={step(1)}
        whileTap={{ scale: TAP_SCALE }}
        transition={stepperTapTransition}
        aria-label="Increase quantity"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2.5v7M2.5 6h7" stroke="var(--c-green)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.button>
    </div>
  );
}
