import { motion } from 'framer-motion';

type Props = {
  price: number;
};

const ENTRANCE = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

export function MemberPriceLabel({ price }: Props) {
  return (
    <div className="offer-badge-slot">
      <motion.div
        className="offer-badge-message"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ENTRANCE}
      >
        <span className="member-price-text member-price-shimmer">Member Price: ₹{price}</span>
      </motion.div>
    </div>
  );
}
