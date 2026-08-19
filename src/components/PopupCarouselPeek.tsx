import type { Product } from '../data/products';
import { motion } from 'framer-motion';
import { PopupCardFace } from './PopupCardFace';

type Props = {
  product: Product;
  side: 'left' | 'right';
  left: number;
  width: number;
  /** Carousel position of this neighbour, for its dot indicator. */
  index: number;
  /** Peeks stay mounted across index changes; only opacity animates. */
  visible: boolean;
};

/**
 * Neighbour popup, clipped by the phone viewport edge.
 *
 * Rendered at its own *active* width and full popup content, so committing a swipe slides
 * in a card that is already complete and correctly sized — the product swap at snap end
 * then changes nothing on screen.
 */
export function PopupCarouselPeek({ product, side, left, width, index, visible }: Props) {
  return (
    <motion.div
      className={`popup-carousel-adjacent popup-carousel-adjacent--${side}`}
      style={{ left, width }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      aria-hidden
    >
      <PopupCardFace product={product} index={index} />
    </motion.div>
  );
}
