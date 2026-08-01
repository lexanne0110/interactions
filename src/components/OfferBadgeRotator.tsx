import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
  star: '/assets/category-listing/icons/star-06.svg',
  'trend-down': '/assets/category-listing/icons/trend-down-01.svg',
};

export function OfferBadgeRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % OFFER_MESSAGES.length);
    }, DISPLAY_MS);

    return () => window.clearInterval(timer);
  }, []);

  const message = OFFER_MESSAGES[index];

  return (
    <div className="offer-badge-slot">
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
