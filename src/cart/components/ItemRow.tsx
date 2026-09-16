import { motion } from 'framer-motion';
import type { CartItem } from '../cartData';
import { Stepper } from './Stepper';

/** House curve. */
const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  item: CartItem;
  onQuantityChange?: (id: string, next: number, prev: number) => void;
};

/**
 * One cart line — 334×58 inside a wrapper that owns the row's height and gap.
 *
 * The wrapper is what collapses on removal. Animating the *list* instead would
 * repaint every sibling and flicker the product images; animating only this row
 * lets the ones below slide up under `layout` while their contents stay static.
 */
export function ItemRow({ item, onQuantityChange }: Props) {
  return (
    <motion.div
      className="item-row-wrap"
      layout
      /* pointerEvents off on exit: the row stays mounted for the 260ms collapse,
         and without this its stepper is still tappable while it disappears. */
      exit={{ height: 0, marginBottom: 0, opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.26, ease: EASE }}
    >
      <div className="item-row" data-item={item.id}>
        <div className="item-row__thumb">
          <img src={item.image} alt="" />
        </div>

        <div className="item-row__main">
          <div className="item-row__info">
            <div className="item-row__names">
              <span className="item-row__name">{item.name}</span>
              <span className="item-row__weight">{item.weight}</span>
            </div>
            <div className="item-row__prices">
              <span className="item-row__price">₹{item.price}</span>
              {item.was != null && <span className="item-row__was">₹{item.was}</span>}
            </div>
          </div>

          <Stepper
            value={item.qty}
            onChange={(next, prev) => onQuantityChange?.(item.id, next, prev)}
          />
        </div>
      </div>
    </motion.div>
  );
}
