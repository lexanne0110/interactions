import { AnimatePresence, motion } from 'framer-motion';
import type { CartItem } from '../cartData';
import { delivery } from '../cartData';
import { ItemRow } from './ItemRow';

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  items: CartItem[];
  windowLabel?: string;
  windowValue?: string;
  /** Shown as a pill beside the window, e.g. "Delivery 1" in a split cart. */
  groupTag?: string;
  onChangeSlot?: () => void;
  onQuantityChange?: (id: string, next: number, prev: number) => void;
};

/**
 * The delivery group card: window header, dashed rule, then the item rows.
 * A split cart renders two of these, which is why the window is a prop rather
 * than read from the module — `delivery-split` re-parents rows between them.
 */
export function ItemsCard({
  items,
  windowLabel = delivery.windowLabel,
  windowValue = delivery.windowValue,
  groupTag,
  onChangeSlot,
  onQuantityChange,
}: Props) {
  return (
    <motion.section className="cart-card items-card" layout transition={{ duration: 0.26, ease: EASE }}>
      <header className="items-card__head">
        <div className="items-card__when">
          <span className="items-card__when-label">{windowLabel}</span>
          <span className="items-card__when-value">{windowValue}</span>
          {groupTag && <span className="items-card__tag">{groupTag}</span>}
        </div>
        <button className="items-card__slot" onClick={onChangeSlot}>
          Change Slot
        </button>
      </header>

      <div className="items-card__rule" />

      <div className="items-card__list">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onQuantityChange={onQuantityChange} />
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
