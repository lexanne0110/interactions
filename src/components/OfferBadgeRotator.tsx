import { assetUrl } from '../lib/assetUrl';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type OfferMessage = {
  id: string;
  label: string;
  icon?: 'star' | 'trend-down';
  iconPosition?: 'before' | 'after';
};

const OFFER_MESSAGES: OfferMessage[] = [
  { id: 'off', label: '19% OFF' },
  { id: 'pay-less', label: 'Pay ₹8 less', icon: 'star', iconPosition: 'after' },
  { id: 'price-drop', label: 'Price Drop', icon: 'trend-down', iconPosition: 'before' },
];

const DISPLAY_MS = 2800;
const TRANSITION = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

const OFFER_ICONS = {
  star: assetUrl('/assets/category-listing/icons/star-06.svg'),
  'trend-down': assetUrl('/assets/category-listing/icons/trend-down-01.svg'),
};

/**
 * Cycles offer copy in place.
 *
 * WCAG 2.2.2 (Pause, Stop, Hide) applies — this auto-updates indefinitely, well past the
 * 5s threshold — so rotation pauses on hover and on keyboard focus, and stops entirely
 * when the user has asked for reduced motion. It also pauses while the tab is hidden, so
 * a backgrounded prototype isn't burning a timer forever.
 */
export function OfferBadgeRotator() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(
    typeof document === 'undefined' ? false : document.hidden,
  );
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onVisibility = () => setDocumentHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const rotating = !paused && !reduceMotion && !documentHidden;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % OFFER_MESSAGES.length);
    }, DISPLAY_MS);

    return () => window.clearInterval(timer);
  }, [rotating]);

  const message = OFFER_MESSAGES[index];

  return (
    <div
      className="offer-badge-slot"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={message.id}
          className="offer-badge-message"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={TRANSITION}
        >
          {message.icon === 'trend-down' && (
            <img className="offer-badge-icon" src={OFFER_ICONS['trend-down']} alt="" aria-hidden />
          )}
          <span className="offer-green-text">{message.label}</span>
          {message.icon === 'star' && (
            <img className="offer-badge-icon" src={OFFER_ICONS.star} alt="" aria-hidden />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
