import type { MouseEvent } from 'react';
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  openEase,
  stepperCountEase,
  stepperCountEnterTransition,
  stepperCountExitTransition,
  stepperMorphFade,
  stepperMorphSpring,
  stepperTapTransition,
} from '../lib/transitions';

const MAX = 5;
const TAP_SCALE = 0.97;
const COUNT_TRAVEL = '65%';

type Props = {
  className?: string;
  /** Controlled quantity. When omitted, the stepper keeps its own local count. */
  count?: number;
  onCountChange?: (next: number, prev: number) => void;
};

const controlsVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.018,
      delayChildren: 0.022,
      ...stepperMorphFade,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: openEase,
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const controlItemVariants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: stepperMorphSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: stepperMorphFade,
  },
};

export function AddButtonStepper({
  className = '',
  count: controlledCount,
  onCountChange,
}: Props) {
  const [uncontrolledCount, setUncontrolledCount] = useState(0);
  const isControlled = controlledCount !== undefined;
  const count = isControlled ? controlledCount : uncontrolledCount;
  const directionRef = useRef<'up' | 'down'>('up');

  const commitCount = (next: number) => {
    const prev = count;
    if (next === prev) return;
    if (!isControlled) setUncontrolledCount(next);
    onCountChange?.(next, prev);
  };

  const showStepper = count > 0;
  const atMax = count >= MAX;

  const handleInitialAdd = (e: MouseEvent) => {
    e.stopPropagation();
    directionRef.current = 'up';
    commitCount(1);
  };

  const handleIncrement = (e: MouseEvent) => {
    e.stopPropagation();
    if (atMax) return;
    directionRef.current = 'up';
    commitCount(Math.min(count + 1, MAX));
  };

  const handleDecrement = (e: MouseEvent) => {
    e.stopPropagation();
    directionRef.current = 'down';
    commitCount(Math.max(count - 1, 0));
  };

  type StepperDirection = 'up' | 'down';

  const makeCountVariants = (isMax: boolean) => ({
    enter: (direction: StepperDirection) => ({
      y: direction === 'up' ? COUNT_TRAVEL : `-${COUNT_TRAVEL}`,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
      ...(isMax ? { fontSize: 11, letterSpacing: '0.02em' } : {}),
      transition: stepperCountEnterTransition,
    },
    exit: (direction: StepperDirection) => ({
      y: direction === 'up' ? `-${COUNT_TRAVEL}` : COUNT_TRAVEL,
      opacity: 0,
      ...(isMax ? { fontSize: 13, letterSpacing: '0em' } : {}),
      transition: stepperCountExitTransition,
    }),
  });

  const countVariants = makeCountVariants(false);
  const maxVariants = makeCountVariants(true);

  const countKey = atMax ? 'max' : String(count);
  const countLabel = atMax ? 'MAX' : String(count);

  return (
    <motion.div
      className={`add-btn-stepper ${showStepper ? 'is-active' : ''} ${className}`}
      layout
      transition={stepperMorphSpring}
      onClick={(e) => e.stopPropagation()}
    >
      <AnimatePresence initial={false}>
        {!showStepper && (
          <motion.button
            key="add"
            type="button"
            className="add-btn-stepper-add"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={stepperMorphFade}
            whileTap={{ scale: TAP_SCALE }}
            onClick={handleInitialAdd}
          >
            ADD
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showStepper && (
          <motion.div
            key="stepper"
            className="add-btn-stepper-controls"
            variants={controlsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              type="button"
              className="add-btn-stepper-btn"
              variants={controlItemVariants}
              aria-label="Decrease quantity"
              whileTap={{ scale: TAP_SCALE }}
              transition={stepperTapTransition}
              onClick={handleDecrement}
            >
              −
            </motion.button>

            <motion.div
              className="add-btn-stepper-count"
              variants={controlItemVariants}
              aria-live="polite"
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.span
                  key={countKey}
                  custom={directionRef.current}
                  className={`add-btn-stepper-value ${atMax ? 'is-max' : ''}`}
                  variants={atMax ? maxVariants : countVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {countLabel}
                </motion.span>
              </AnimatePresence>
            </motion.div>

            <motion.button
              type="button"
              className="add-btn-stepper-btn"
              variants={controlItemVariants}
              aria-label="Increase quantity"
              disabled={atMax}
              animate={{ opacity: atMax ? 0.35 : 1 }}
              transition={{ duration: 0.35, ease: stepperCountEase }}
              whileTap={atMax ? undefined : { scale: TAP_SCALE }}
              onClick={handleIncrement}
            >
              +
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
