import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Product } from '../data/products';
import { productCartThumb } from '../data/products';
import { openEase } from '../lib/transitions';

const MAX_THUMBS = 3;
const COMPACT_WIDTH = 56;
const FULL_WIDTH = 358;
/** Center the front thumb in the compact clip. */
const THUMBS_CENTER_X = (FULL_WIDTH - COMPACT_WIDTH) / 2;

const THUMB_SLOTS = [
  { left: 0, top: 0.84, width: 40.43, height: 41.16, zIndex: 3 },
  { left: 17.51, top: 0, width: 39.7, height: 40.42, zIndex: 2 },
  { left: 34.3, top: 0.22, width: 39.7, height: 40.42, zIndex: 1 },
] as const;

const THUMB_DROP_PX = 28;

const dropDuration = 0.28;
/** Moves from frame 1 — openEase ease-out reads as a freeze at the start. */
const motionEase = [0.32, 0, 0.67, 1] as const;
const dropTransition = { duration: dropDuration, ease: motionEase };
const expandTransition = { duration: 0.36, ease: motionEase };
/** Reslotting when the stack shifts — same curve as the drop so they read as one move. */
const slotTransition = { duration: dropDuration, ease: motionEase };
/** Start widening while the item is still landing — no dead pause after drop. */
const expandOverlap = dropDuration * 0.68;

const hideTransition = {
  width: { duration: 0.26, ease: openEase },
  opacity: { duration: 0.16, ease: openEase },
  y: { duration: 0.2, ease: openEase },
};

type Props = {
  items: Product[];
  uniqueCount: number;
  /** Drives show/hide. The bar stays mounted so its open choreography can reset. */
  visible: boolean;
};

export function MiniCartBar({ items, uniqueCount, visible }: Props) {
  const [expanded, setExpanded] = useState(false);
  const expandStarted = useRef(false);

  // Keep the last non-empty items so the bar still shows its contents while hiding.
  const lastItemsRef = useRef(items);
  if (items.length) lastItemsRef.current = items;
  const renderItems = items.length ? items : lastItemsRef.current;
  const thumbs = renderItems.slice(-MAX_THUMBS).reverse();

  const startExpand = useCallback(() => {
    if (expandStarted.current) return;
    expandStarted.current = true;
    setExpanded(true);
  }, []);

  // Emptying the cart rearms the open choreography. This used to live in an
  // AnimatePresence exit; because a cancelled exit reuses the same instance, removing
  // and re-adding an item skipped the "opens from the center" reveal entirely.
  useEffect(() => {
    if (visible) return;
    expandStarted.current = false;
    setExpanded(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || items.length !== 1) return;
    const id = window.setTimeout(startExpand, expandOverlap * 1000);
    return () => window.clearTimeout(id);
  }, [visible, items.length, startExpand]);

  return (
    <motion.div
      className="mini-cart-bar-wrap"
      style={{ x: '-50%', pointerEvents: visible ? 'auto' : 'none' }}
      initial={{ width: COMPACT_WIDTH, opacity: 0, y: 6 }}
      animate={
        visible
          ? { width: expanded ? FULL_WIDTH : COMPACT_WIDTH, opacity: 1, y: 0 }
          : { width: COMPACT_WIDTH, opacity: 0, y: 6 }
      }
      transition={
        visible
          ? {
              width: expandTransition,
              opacity: { duration: 0.18, ease: motionEase },
              y: { duration: 0.18, ease: motionEase },
            }
          : hideTransition
      }
      aria-hidden={!visible}
    >
      <div className="mini-cart-bar-content">
        <div className="mini-cart-left">
          <motion.div
            className="mini-cart-thumbs"
            data-count={thumbs.length || 1}
            animate={{ x: expanded ? 0 : THUMBS_CENTER_X }}
            transition={expandTransition}
          >
            <AnimatePresence>
              {thumbs.map((product, index) => {
                const slot = THUMB_SLOTS[index] ?? THUMB_SLOTS[0];

                // Slot geometry is animated, not a static style: when a 4th item pushes
                // the stack along, every remaining thumb changes slot, and static styles
                // made them jump (and resize) in a single frame.
                const slotFrame = {
                  left: slot.left,
                  top: slot.top,
                  width: slot.width,
                  height: slot.height,
                };

                return (
                  <motion.div
                    key={product.id}
                    className="mini-cart-thumb"
                    style={{ zIndex: slot.zIndex }}
                    initial={{ ...slotFrame, opacity: 0, y: -THUMB_DROP_PX }}
                    animate={{ ...slotFrame, opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      y: -THUMB_DROP_PX,
                      transition: dropTransition,
                    }}
                    transition={{
                      opacity: dropTransition,
                      y: dropTransition,
                      left: slotTransition,
                      top: slotTransition,
                      width: slotTransition,
                      height: slotTransition,
                    }}
                  >
                    <img src={productCartThumb(product)} alt="" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="mini-cart-copy"
            initial={{ opacity: 0 }}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.26, ease: motionEase }}
          >
            <p className="mini-cart-title">Unlock Free Delivery</p>
            <p className="mini-cart-subtitle">Shop for 250 more</p>
          </motion.div>
        </div>

        <motion.button
          type="button"
          className="mini-cart-btn"
          tabIndex={visible ? 0 : -1}
          initial={{ opacity: 0 }}
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.26, ease: motionEase }}
        >
          <span className="mini-cart-btn-label">Cart</span>
          <span className="mini-cart-badge">{uniqueCount}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
