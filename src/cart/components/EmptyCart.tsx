import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Empty cart — "never had items".
 *
 * Rises 8px as it fades, and only after the sections above have finished
 * collapsing, so the two movements read as cause and effect rather than a
 * cross-dissolve. No footer: a disabled Pay button on an empty cart is noise.
 */
export function EmptyCart({ onStartShopping }: { onStartShopping?: () => void }) {
  return (
    <motion.div
      className="cart-empty"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE, delay: 0.24 }}
    >
      <span className="cart-empty__disc">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2.5 3h2.2l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.25L20.5 7H6"
            stroke="var(--c-green)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="9.5" cy="19.5" r="1.4" stroke="var(--c-green)" strokeWidth="1.6" />
          <circle cx="16.5" cy="19.5" r="1.4" stroke="var(--c-green)" strokeWidth="1.6" />
        </svg>
      </span>

      <h2 className="cart-empty__title">Your cart is empty</h2>
      <p className="cart-empty__body">
        Add items to get started — most orders arrive in under 30 minutes.
      </p>
      <button className="cart-empty__cta" onClick={onStartShopping}>
        Start shopping
      </button>
    </motion.div>
  );
}
