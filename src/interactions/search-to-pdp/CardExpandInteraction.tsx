import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { SearchScreen } from '../../components/SearchScreen';
import { ProductPopup } from '../../components/ProductPopup';
import { adjacentExpandableProduct } from '../../data/products';
import type { Product } from '../../data/products';
import type { ExpandOrigin } from '../../lib/expandOrigin';
import { measureCloseOriginByProductId, measureExpandOriginByProductId } from '../../lib/expandOrigin';
import '../../App.css';

export function CardExpandInteraction() {
  const [open, setOpen] = useState(false);
  const [popupProduct, setPopupProduct] = useState<Product | null>(null);
  const [originProductId, setOriginProductId] = useState<string | null>(null);
  const [expandOrigin, setExpandOrigin] = useState<ExpandOrigin | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeHandoff, setCloseHandoff] = useState(false);
  const [handoffProductId, setHandoffProductId] = useState<string | null>(null);
  const [layoutResetKey, setLayoutResetKey] = useState(0);
  const morphDoneRef = useRef(false);
  const closingRef = useRef(false);
  const closeStartedAtRef = useRef(0);
  /** Bumped on every expand, so a close's deferred teardown can tell whether the popup it
   *  was tearing down is still the current one. */
  const openGenerationRef = useRef(0);
  closingRef.current = closing;

  const overlayActive = open || closing || closeHandoff;

  const handleExpand = useCallback(
    (product: Product, origin: ExpandOrigin) => {
      if (open || closing) return;
      flushSync(() => {
        openGenerationRef.current += 1;
        setClosing(false);
        setExpandOrigin(origin);
        setPopupProduct(product);
        setOriginProductId(product.id);
      });
      requestAnimationFrame(() => setOpen(true));
    },
    [open, closing],
  );

  const handleClose = useCallback(() => {
    if (closing) return;
    const freshOrigin = originProductId
      ? measureCloseOriginByProductId(originProductId)
      : null;
    flushSync(() => {
      if (freshOrigin) setExpandOrigin(freshOrigin);
      // Reset layered hero transforms while the handoff card stays hidden.
      setLayoutResetKey((key) => key + 1);
      closeStartedAtRef.current = performance.now();
      setHandoffProductId(originProductId);
      setCloseHandoff(true);
      setClosing(true);
    });
    setOpen(false);
  }, [closing, originProductId]);

  const handleCloseHandoffStart = useCallback(() => {
    flushSync(() => {
      setCloseHandoff(false);
      setHandoffProductId(null);
    });
  }, []);

  const finishClose = useCallback(() => {
    if (morphDoneRef.current || !closingRef.current) return;
    morphDoneRef.current = true;

    flushSync(() => {
      setClosing(false);
      // Also release the handoff here. Normally onCloseHandoffStart has already done it,
      // but if we arrive via the fallback timer below that never ran — and leaving
      // closeHandoff/handoffProductId set keeps the grid card hidden and the scroll
      // locked for good.
      setCloseHandoff(false);
      setHandoffProductId(null);
    });

    // Teardown is deferred a frame so the morph's last painted frame isn't yanked away.
    // `closing` is already false by now though, so handleExpand will accept a tap in that
    // window — if one lands, this teardown must not null out the popup that just opened.
    const generation = openGenerationRef.current;
    requestAnimationFrame(() => {
      if (openGenerationRef.current !== generation) return;
      setPopupProduct(null);
      setOriginProductId(null);
      setExpandOrigin(null);
    });
  }, []);

  const handleMorphComplete = useCallback(() => {
    finishClose();
  }, [finishClose]);

  useEffect(() => {
    if (!closing) {
      morphDoneRef.current = false;
      closeStartedAtRef.current = 0;
      return;
    }
    // Fallback if sheet onAnimationComplete never fires (layout/PDP close edge cases).
    const timer = window.setTimeout(finishClose, 1200);
    return () => window.clearTimeout(timer);
  }, [closing, finishClose]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!popupProduct || closing || !open) return;
      const next = adjacentExpandableProduct(popupProduct.id, direction);
      if (!next) return;
      flushSync(() => {
        setPopupProduct(next);
        setOriginProductId(next.id);
      });
      requestAnimationFrame(() => {
        const origin = measureExpandOriginByProductId(next.id);
        if (origin) setExpandOrigin(origin);
      });
    },
    [popupProduct, closing, open],
  );

  return (
    <div className={`phone-scroll ${overlayActive ? 'locked' : ''}`}>
      <SearchScreen
        open={open}
        closing={closing}
        closeHandoff={closeHandoff}
        handoffProductId={handoffProductId}
        activeProductId={originProductId}
        layoutResetKey={layoutResetKey}
        onExpand={handleExpand}
      />

      <AnimatePresence>
        {(open || closing) && popupProduct && expandOrigin && (
          <ProductPopup
            product={popupProduct}
            expandOrigin={expandOrigin}
            closing={closing}
            onClose={handleClose}
            onSwipe={handleSwipe}
            onCloseHandoffStart={handleCloseHandoffStart}
            onMorphComplete={handleMorphComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
