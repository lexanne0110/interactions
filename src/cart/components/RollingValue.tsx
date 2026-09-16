import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  stepperCountEnterTransition,
  stepperCountExitTransition,
} from '../../lib/transitions';

const TRAVEL = '70%';

type Props = {
  /** Rendered text, e.g. "₹661". Changing it plays the roll. */
  value: string;
  /** Numeric value behind the text, used only to pick the roll direction. */
  amount: number;
  className?: string;
  /** Hold the roll back so a cause reads before its effect. */
  delay?: number;
};

/**
 * A money figure that rolls when it changes.
 *
 * Direction follows the maths — a total going down rolls down — so the motion
 * says which way the number moved before the reader has parsed the digits.
 * Reuses the stepper's count transitions so every changing number in the app
 * moves the same way.
 */
export function RollingValue({ value, amount, className, delay = 0 }: Props) {
  const prev = useRef(amount);
  const dir = amount > prev.current ? 'up' : 'down';
  prev.current = amount;

  return (
    <span className={`rolling${className ? ` ${className}` : ''}`}>
      {/* Invisible sizer: keeps the slot at the widest value's width so
          neighbours never shift while a figure is mid-roll. */}
      <span className="rolling__sizer" aria-hidden="true">{value}</span>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.span
          key={value}
          className="rolling__value"
          custom={dir}
          initial={{ y: dir === 'up' ? TRAVEL : `-${TRAVEL}`, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { ...stepperCountEnterTransition, delay } }}
          exit={{ y: dir === 'up' ? `-${TRAVEL}` : TRAVEL, opacity: 0, transition: stepperCountExitTransition }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
