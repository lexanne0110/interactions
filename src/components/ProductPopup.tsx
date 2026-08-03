import { assetUrl } from '../lib/assetUrl';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../data/products';
import { carouselExpandContext, expandableCarouselProducts, recommendations } from '../data/products';
import { CardMorphPreview } from './CardMorphPreview';
import { HeroControls } from './HeroControls';
import { PopupCarouselPeek } from './PopupCarouselPeek';
import { PreviouslyBoughtBadge } from './PreviouslyBoughtBadge';
import {
  expandLayout,
  scrollToProgress,
  SCROLL_THRESHOLD,
  CHROME_CROSSOVER,
} from '../lib/expandInterpolation';
import type { ExpandOrigin, SheetFrame } from '../lib/expandOrigin';
import {
  IDENTITY_MORPH,
  PDP_FRAME,
  POPUP_FRAME,
  originToMorphTransform,
  popupCarouselSheetLeft,
  popupSheetLeft,
} from '../lib/expandOrigin';
import {
  closeTransition,
  openTransition,
  popupContentFadeOut,
  popupContentFadeIn,
  popupSwipeContentFadeIn,
} from '../lib/transitions';

export type { ExpandOrigin } from '../lib/expandOrigin';

type Props = {
  product: Product;
  expandOrigin: ExpandOrigin;
  onClose: () => void;
  closing?: boolean;
  onMorphComplete?: () => void;
  onCloseHandoffStart?: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
};

type ViewMode = 'popup' | 'pdp';

const INSTANT = { duration: 0 } as const;
const CONTENT_REVEAL_DELAY_MS = 220;
const SWIPE_THRESHOLD_PX = 48;
const SWIPE_DRAG_CLAMP_PX = 96;
const SWIPE_COMMIT_MS = 260;
const CLOSE_SETTLE_CROSSFADE = {
  duration: closeTransition.duration,
  // Swap to card preview once the sheet has shrunk enough to read as a card.
  times: [0, 0.72, 1],
  ease: closeTransition.ease,
};
const CLOSE_MORPH_MS = closeTransition.duration * 1000;

function sheetFrameAtProgress(progress: number): SheetFrame {
  const width = expandLayout.sheetWidth(progress);
  return {
    top: expandLayout.rootPaddingTop(progress),
    left: popupSheetLeft(width),
    width,
    height: expandLayout.sheetHeight(progress),
    borderRadius: expandLayout.borderRadius(progress),
    boxShadow:
      progress < 1
        ? `0 8px 40px rgba(16, 24, 40, ${expandLayout.boxShadowAlpha(progress)})`
        : 'none',
  };
}

export function ProductPopup({
  product,
  expandOrigin,
  onClose,
  closing = false,
  onMorphComplete,
  onCloseHandoffStart,
  onSwipe,
}: Props) {
  const [mode, setMode] = useState<ViewMode>('popup');
  const [expandProgress, setExpandProgress] = useState(0);
  const [scrollEngaged, setScrollEngaged] = useState(false);
  const [morphComplete, setMorphComplete] = useState(false);
  const [closeTransformReady, setCloseTransformReady] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [displayProduct, setDisplayProduct] = useState(product);
  const [contentVisible, setContentVisible] = useState(true);
  const [swapGeneration, setSwapGeneration] = useState(0);
  const [previewHandoffActive, setPreviewHandoffActive] = useState(false);
  const [closePreviewVisible, setClosePreviewVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suppressExpandRef = useRef(false);
  const closeDoneRef = useRef(false);
  const closeMorphReadyAtRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipePointerIdRef = useRef<number | null>(null);
  const swipeCommittedRef = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeTransitionActive, setSwipeTransitionActive] = useState(false);
  const animateProductSwapRef = useRef(false);
  const openedOnceRef = useRef(false);
  const prevClosingRef = useRef(false);
  const closingSnapshotRef = useRef<{
    visualProgress: number;
    frame: SheetFrame;
    wasScrollDriven: boolean;
  } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const heroImage =
    displayProduct.popupHeroImage ?? displayProduct.images[0]?.src ?? '';
  const isCommittedPdp = mode === 'pdp';

  // Snapshot layout on first close frame — morph directly back to card (no popup intermediate).
  if (closing && !prevClosingRef.current) {
    closeMorphReadyAtRef.current = performance.now();
    const domProgress = scrollRef.current ? scrollToProgress(scrollRef.current.scrollTop) : 0;
    const progress = isCommittedPdp
      ? 1
      : Math.max(expandProgress, domProgress);
    const wasScrollDriven =
      isCommittedPdp || expandProgress > 0 || scrollEngaged || domProgress > 0;
    const frame =
      progress >= 1 ? PDP_FRAME : progress > 0 ? sheetFrameAtProgress(progress) : POPUP_FRAME;

    closingSnapshotRef.current = {
      visualProgress: progress,
      frame,
      wasScrollDriven,
    };
  }
  if (!closing) {
    closingSnapshotRef.current = null;
  }
  prevClosingRef.current = closing;

  const closingSnapshot = closingSnapshotRef.current;
  const closeTargetFrame = closingSnapshot?.frame ?? POPUP_FRAME;

  const visualProgress = closing
    ? (closingSnapshot?.visualProgress ?? 0)
    : isCommittedPdp
      ? 1
      : expandProgress;

  const shellMorphing = !morphComplete && !closing;
  const scrollListening = morphComplete && !closing;
  const scrollDrivenStyles = closing
    ? (closingSnapshot?.wasScrollDriven ?? false)
    : scrollListening && (scrollEngaged || isCommittedPdp);

  const showPdpLayout = scrollDrivenStyles && visualProgress >= 1;
  const showInfoContent = contentReady;
  const showEmptyInfoShell = !showInfoContent && !scrollDrivenStyles && !shellMorphing;
  const pdpChrome = visualProgress >= CHROME_CROSSOVER;
  const heroControlsVariant = pdpChrome ? 'pdp' : 'popup';
  const carousel = carouselExpandContext(displayProduct.id);
  const showCarousel =
    !!onSwipe && morphComplete && !closing && mode === 'popup' && !scrollEngaged;
  const popupFrameLeft = showCarousel
    ? popupCarouselSheetLeft(POPUP_FRAME.width, !!carousel.next, !!carousel.prev)
    : POPUP_FRAME.left;
  const popupFrame: SheetFrame = { ...POPUP_FRAME, left: popupFrameLeft };
  const canSwipe = showCarousel;

  const morphFrom = useMemo(
    () => originToMorphTransform(expandOrigin, popupFrame),
    [expandOrigin, popupFrame.left],
  );

  const closeMorphFrom = useMemo(
    () => originToMorphTransform(expandOrigin, closeTargetFrame),
    [expandOrigin, closeTargetFrame],
  );

  // Open: card → GPU morph → popup, then scroll layout → PDP.
  // Close: frozen layout → single GPU morph → card (popup or PDP, no intermediate).
  const morphCloseActive = closing && closeTransformReady;
  const useTransformMorph =
    (closing && closeTransformReady) || (!closing && !scrollDrivenStyles);
  const isOpenMorphing = !morphComplete && !closing && useTransformMorph;
  const effectiveScrollDriven = scrollDrivenStyles;

  const sheetFrame = useMemo((): SheetFrame => {
    if (closing && closingSnapshot) return closingSnapshot.frame;
    if (isCommittedPdp) return PDP_FRAME;
    if (scrollDrivenStyles) {
      const width = expandLayout.sheetWidth(visualProgress);
      return {
        top: expandLayout.rootPaddingTop(visualProgress),
        left: popupSheetLeft(width),
        width,
        height: expandLayout.sheetHeight(visualProgress),
        borderRadius: expandLayout.borderRadius(visualProgress),
        boxShadow:
          visualProgress < 1
            ? `0 8px 40px rgba(16, 24, 40, ${expandLayout.boxShadowAlpha(visualProgress)})`
            : 'none',
      };
    }
    return popupFrame;
  }, [closing, expandOrigin, isCommittedPdp, popupFrame, scrollDrivenStyles, visualProgress]);

  const sheetTransition = INSTANT;
  const transformTransition = morphCloseActive
    ? closeTransition
    : isOpenMorphing
      ? openTransition
      : INSTANT;

  const sheetStyle = scrollDrivenStyles
    ? { maxHeight: expandLayout.sheetHeight(visualProgress) }
    : undefined;

  const rootStyle = scrollDrivenStyles
    ? {
        paddingTop: expandLayout.rootPaddingTop(visualProgress),
        alignItems: (visualProgress >= 1 ? 'stretch' : 'flex-start') as
          | 'stretch'
          | 'flex-start',
        ['--popup-bottom-inset' as string]: `${expandLayout.cartBarBottom(visualProgress)}px`,
      }
    : undefined;

  const cartBarStyle = scrollDrivenStyles
    ? {
        borderRadius: `0 0 ${expandLayout.cartBarBorderRadius(visualProgress)}px ${expandLayout.cartBarBorderRadius(visualProgress)}px`,
      }
    : undefined;

  const beginCloseHandoff = useCallback(() => {
    if (closeDoneRef.current) return;
    const readyAt = closeMorphReadyAtRef.current;
    if (!readyAt) return;
    // Ignore spurious onAnimationComplete callbacks before the close morph finishes.
    if (performance.now() - readyAt < CLOSE_MORPH_MS - 32) return;
    closeDoneRef.current = true;
    onCloseHandoffStart?.();
    setPreviewHandoffActive(true);
  }, [onCloseHandoffStart]);

  const beginCloseHandoffRef = useRef(beginCloseHandoff);
  beginCloseHandoffRef.current = beginCloseHandoff;

  useEffect(() => {
    if (!closing || !closeTransformReady) return;
    const timer = window.setTimeout(() => beginCloseHandoffRef.current(), CLOSE_MORPH_MS);
    return () => window.clearTimeout(timer);
  }, [closing, closeTransformReady, product.id]);

  useEffect(() => {
    if (!closing) {
      setClosePreviewVisible(false);
      return;
    }
    const swapMs = CLOSE_MORPH_MS * CLOSE_SETTLE_CROSSFADE.times[1];
    const timer = window.setTimeout(() => setClosePreviewVisible(true), swapMs);
    return () => window.clearTimeout(timer);
  }, [closing, product.id]);

  useEffect(() => {
    if (!closing) {
      setCloseTransformReady(false);
      closeMorphReadyAtRef.current = 0;
      return;
    }

    const wasScrollDriven = closingSnapshotRef.current?.wasScrollDriven ?? false;
    if (!wasScrollDriven) {
      setCloseTransformReady(true);
      return;
    }

    setCloseTransformReady(false);
    const id = requestAnimationFrame(() => setCloseTransformReady(true));
    return () => cancelAnimationFrame(id);
  }, [closing, product.id]);

  useEffect(() => {
    if (closing) {
      closeDoneRef.current = false;
      setPreviewHandoffActive(false);
      setClosePreviewVisible(false);
      suppressExpandRef.current = false;
      swipeStartRef.current = null;
      swipeCommittedRef.current = false;
      setSwipeOffset(0);
      setSwipeTransitionActive(false);
      const sheet = sheetRef.current;
      const pointerId = swipePointerIdRef.current;
      if (sheet && pointerId != null && sheet.hasPointerCapture(pointerId)) {
        sheet.releasePointerCapture(pointerId);
      }
      swipePointerIdRef.current = null;
      return;
    }

    if (!openedOnceRef.current) {
      openedOnceRef.current = true;
      setContentReady(false);
      const timer = window.setTimeout(() => setContentReady(true), CONTENT_REVEAL_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    setContentReady(true);
  }, [closing, product.id]);

  useEffect(() => {
    if (closing) return;
    const timer = window.setTimeout(() => setMorphComplete(true), 460);
    return () => window.clearTimeout(timer);
  }, [closing, product.id]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !morphComplete || isCommittedPdp) return;

    const engaged = el.scrollTop >= SCROLL_THRESHOLD;
    setScrollEngaged(engaged);

    if (el.scrollTop < SCROLL_THRESHOLD) {
      suppressExpandRef.current = false;
    }

    if (suppressExpandRef.current) return;

    const progress = scrollToProgress(el.scrollTop);
    setExpandProgress(progress);

    if (progress >= 1) {
      suppressExpandRef.current = true;
      setMode('pdp');
    }
  }, [morphComplete, isCommittedPdp]);

  const handleBack = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canSwipe || event.button !== 0 || swipeCommittedRef.current) return;
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, [role="button"]')) return;
      swipeStartRef.current = { x: event.clientX, y: event.clientY };
      swipePointerIdRef.current = event.pointerId;
      setSwipeTransitionActive(false);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [canSwipe],
  );

  const commitSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const neighbor = direction === 'left' ? carousel.prev : carousel.next;
      if (!neighbor || swipeCommittedRef.current || !onSwipe) return;

      swipeCommittedRef.current = true;
      animateProductSwapRef.current = true;
      setSwipeTransitionActive(true);

      const travel = POPUP_FRAME.width + 40;
      const exitX = direction === 'left' ? travel : -travel;
      setSwipeOffset(exitX);

      window.setTimeout(() => {
        onSwipe(direction);
        setSwipeOffset(direction === 'left' ? -travel : travel);
        requestAnimationFrame(() => {
          setSwipeOffset(0);
          setSwipeTransitionActive(false);
          swipeCommittedRef.current = false;
          animateProductSwapRef.current = false;
        });
      }, SWIPE_COMMIT_MS);
    },
    [carousel.next, carousel.prev, onSwipe],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canSwipe || !swipeStartRef.current || swipeCommittedRef.current) return;
      const dx = event.clientX - swipeStartRef.current.x;
      const dy = event.clientY - swipeStartRef.current.y;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        swipeStartRef.current = null;
        setSwipeOffset(0);
        return;
      }
      const clamped =
        dx > 0 && !carousel.prev
          ? Math.min(dx, SWIPE_DRAG_CLAMP_PX) * 0.35
          : dx < 0 && !carousel.next
            ? Math.max(dx, -SWIPE_DRAG_CLAMP_PX) * 0.35
            : Math.max(-SWIPE_DRAG_CLAMP_PX, Math.min(SWIPE_DRAG_CLAMP_PX, dx));
      setSwipeOffset(clamped);
    },
    [canSwipe, carousel.next, carousel.prev],
  );

  const finishSwipe = useCallback(
    (clientX: number, clientY: number) => {
      if (!canSwipe || !swipeStartRef.current || swipeCommittedRef.current) return;

      const dx = clientX - swipeStartRef.current.x;
      const dy = clientY - swipeStartRef.current.y;
      swipeStartRef.current = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) {
        setSwipeTransitionActive(true);
        setSwipeOffset(0);
        return;
      }

      // Drag left → next product; drag right → previous.
      if (dx < 0 && carousel.next) {
        commitSwipe('right');
        return;
      }
      if (dx > 0 && carousel.prev) {
        commitSwipe('left');
        return;
      }

      setSwipeTransitionActive(true);
      setSwipeOffset(0);
    },
    [canSwipe, carousel.next, carousel.prev, commitSwipe],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      finishSwipe(event.clientX, event.clientY);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      swipePointerIdRef.current = null;
    },
    [finishSwipe],
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      swipeStartRef.current = null;
      swipeCommittedRef.current = false;
      setSwipeTransitionActive(true);
      setSwipeOffset(0);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      swipePointerIdRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (product.id === displayProduct.id) return;

    if (!animateProductSwapRef.current) {
      setDisplayProduct(product);
      setContentVisible(true);
      return;
    }

    setDisplayProduct(product);
    setContentVisible(true);
    setSwapGeneration((generation) => generation + 1);
  }, [product, displayProduct.id]);

  const belowFoldPdp = visualProgress >= 1;
  const contentFadeInTransition =
    swapGeneration > 0 ? popupSwipeContentFadeIn : popupContentFadeIn;
  const contentSwapTransition = contentVisible
    ? contentFadeInTransition
    : popupContentFadeOut;
  const contentSwapOpacity = closing ? (previewHandoffActive ? 0 : 1) : contentVisible ? 1 : 0;
  const chromeFadeTransition = closing
    ? popupContentFadeOut
    : { duration: 0.28, ease: [0, 0, 0.2, 1] as const };
  const transformFrame = closing ? closeTargetFrame : popupFrame;
  const swipeMotionTransition = swipeTransitionActive
    ? { duration: SWIPE_COMMIT_MS / 1000, ease: [0.4, 0, 0.2, 1] as const }
    : INSTANT;
  const closeContentOpacity = closing ? [1, 1, 0] : 1;
  const closePreviewOpacity = closing ? [0, 0, 1] : 0;
  const closeClipRatio =
    closing && useTransformMorph
      ? Math.min(1, expandOrigin.height / closeTargetFrame.height)
      : 1;
  const closeTransformInitial =
    morphCloseActive && (closingSnapshot?.wasScrollDriven ?? false)
      ? { ...IDENTITY_MORPH, borderRadius: closeTargetFrame.borderRadius }
      : false;

  return (
    <motion.div className="popup-overlay" initial={false}>
      <motion.button
        type="button"
        className="backdrop"
        aria-label="Close product details"
        initial={{ opacity: 0 }}
        animate={{
          opacity: closing
            ? 0
            : scrollDrivenStyles
              ? expandLayout.backdropOpacity(visualProgress)
              : isCommittedPdp
                ? 0
                : 1,
        }}
        transition={
          closing
            ? closeTransition
            : scrollDrivenStyles
              ? INSTANT
              : openTransition
        }
        onClick={onClose}
      />

      <div
        className={`popup-root ${showPdpLayout ? 'is-pdp' : ''} ${scrollDrivenStyles ? 'is-scroll-linked' : ''} ${shellMorphing ? 'is-morphing' : ''} ${showCarousel ? 'is-carousel' : ''}`}
        style={rootStyle}
      >
        {showCarousel && carousel.prev && !carousel.next && (
          <PopupCarouselPeek product={carousel.prev} side="left" />
        )}
        {showCarousel && carousel.next && (
          <PopupCarouselPeek product={carousel.next} side="right" />
        )}

        <motion.div
          ref={sheetRef}
          className={`popup-sheet ${showPdpLayout ? 'is-pdp' : ''} ${scrollDrivenStyles ? 'is-scroll-driven' : ''} ${useTransformMorph ? 'is-morphing' : ''} ${closing ? 'is-closing' : ''} ${closePreviewVisible ? 'is-preview-swap' : ''} ${showCarousel ? 'is-carousel-active' : ''}`}
          initial={
            isOpenMorphing
              ? { ...morphFrom, borderRadius: expandOrigin.borderRadius }
              : closeTransformInitial
          }
          animate={
            useTransformMorph
              ? morphCloseActive
                ? {
                    ...closeMorphFrom,
                    borderRadius: expandOrigin.borderRadius,
                    x: 0,
                  }
                : {
                    ...IDENTITY_MORPH,
                    borderRadius: POPUP_FRAME.borderRadius,
                    x: showCarousel ? swipeOffset : 0,
                  }
              : {
                  top: sheetFrame.top,
                  left: sheetFrame.left,
                  width: sheetFrame.width,
                  height: sheetFrame.height,
                  borderRadius: sheetFrame.borderRadius,
                  x: showCarousel ? swipeOffset : 0,
                }
          }
          transition={
            useTransformMorph
              ? showCarousel && swipeTransitionActive
                ? swipeMotionTransition
                : transformTransition
              : showCarousel && swipeTransitionActive
                ? swipeMotionTransition
                : sheetTransition
          }
          onAnimationComplete={() => {
            if (isOpenMorphing) {
              setMorphComplete(true);
            } else if (morphCloseActive) {
              beginCloseHandoff();
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            position: 'absolute',
            transformOrigin: 'top left',
            ...(useTransformMorph
              ? {
                  top: transformFrame.top,
                  left: transformFrame.left,
                  width: transformFrame.width,
                  height: transformFrame.height,
                }
              : {}),
            boxShadow: sheetFrame.boxShadow ?? '0 8px 40px rgba(16, 24, 40, 0.12)',
            ...(closing && useTransformMorph
              ? { ['--close-clip-ratio' as string]: String(closeClipRatio) }
              : {}),
            ...sheetStyle,
          }}
        >
          {closing && (
            <motion.div
              className="card-morph-preview-layer"
              initial={false}
              animate={{
                opacity: previewHandoffActive ? 0 : closePreviewOpacity,
              }}
              transition={previewHandoffActive ? popupContentFadeOut : CLOSE_SETTLE_CROSSFADE}
              onAnimationComplete={() => {
                if (previewHandoffActive) onMorphComplete?.();
              }}
              aria-hidden={!closing}
            >
              <CardMorphPreview product={product} closing />
            </motion.div>
          )}

          {effectiveScrollDriven && (
            <motion.div
              className="pdp-status-bar"
              initial={false}
              animate={{
                opacity: closing ? closeContentOpacity : expandLayout.statusBarOpacity(visualProgress),
              }}
              transition={closing ? CLOSE_SETTLE_CROSSFADE : INSTANT}
              style={{ pointerEvents: visualProgress >= 1 ? 'auto' : 'none' }}
              aria-hidden={visualProgress < 0.5}
            >
              <img className="status-time" src={assetUrl('/assets/icons/time-1047.svg')} alt="10:47" />
              <div className="status-icons">
                <img src={assetUrl('/assets/icons/wifi.svg')} alt="" aria-hidden />
                <img src={assetUrl('/assets/icons/reception.svg')} alt="" aria-hidden />
                <img src={assetUrl('/assets/icons/battery.svg')} alt="" aria-hidden />
              </div>
            </motion.div>
          )}

          <motion.div
            className={`hero-controls-layer ${pdpChrome ? 'is-pdp' : 'is-popup'}`}
            style={
              scrollDrivenStyles
                ? { top: expandLayout.heroControlTop(visualProgress) }
                : undefined
            }
            animate={{ opacity: closing || shellMorphing ? 0 : 1 }}
            transition={chromeFadeTransition}
            aria-hidden={closing || shellMorphing}
          >
            <HeroControls variant={heroControlsVariant} onBack={handleBack} />
          </motion.div>

          <motion.div
            ref={scrollRef}
            className={`popup-scroll ${showPdpLayout ? 'is-pdp' : ''} ${shellMorphing ? 'is-morphing' : ''} ${closing ? 'is-closing' : ''}`}
            onScroll={handleScroll}
            initial={false}
            animate={{ opacity: closeContentOpacity }}
            transition={closing ? CLOSE_SETTLE_CROSSFADE : INSTANT}
            style={{ pointerEvents: closing ? 'none' : 'auto', flex: 1, minHeight: 0, visibility: closePreviewVisible ? 'hidden' : 'visible' }}
          >
            <div className="popup-expand-shell">
              <section className={`popup-hero-section ${pdpChrome ? 'is-pdp' : ''}`}>
                <div
                  className={`popup-hero-bg ${pdpChrome ? 'is-pdp' : ''}`}
                  style={
                    scrollDrivenStyles
                      ? { height: expandLayout.heroHeight(visualProgress) }
                      : undefined
                  }
                >
                  <motion.div
                    animate={{ opacity: contentSwapOpacity }}
                    transition={
                      shellMorphing || closing ? INSTANT : contentSwapTransition
                    }
                    className={`popup-hero-img-slot${displayProduct.popupHeroSlotClass ? ` ${displayProduct.popupHeroSlotClass}` : ''}`}
                  >
                    <img
                      className={`popup-hero-img${displayProduct.popupHeroClass ? ` ${displayProduct.popupHeroClass}` : ''}`}
                      src={heroImage}
                      alt={displayProduct.title}
                    />
                  </motion.div>
                </div>

                <div className="carousel-dots" aria-hidden={shellMorphing}>
                  {!shellMorphing
                    ? expandableCarouselProducts.map((item, dotIndex) => (
                        <span
                          key={item.id}
                          className={`dot${dotIndex === carousel.index ? ' active' : ''}`}
                        />
                      ))
                    : null}
                </div>
              </section>

              {showEmptyInfoShell && (
                <div className="popup-info-card popup-info-card--shell" aria-hidden />
              )}

              {showInfoContent && (
                <div
                  className={`popup-info-card ${pdpChrome ? 'is-pdp' : ''}`}
                  style={
                    scrollDrivenStyles
                      ? {
                          marginTop: expandLayout.infoMarginTop(visualProgress),
                          marginLeft: expandLayout.infoMarginH(visualProgress),
                          marginRight: expandLayout.infoMarginH(visualProgress),
                        }
                      : undefined
                  }
                >
                  <motion.div
                    initial={closing ? false : { opacity: 0 }}
                    animate={{ opacity: contentSwapOpacity }}
                    transition={
                      closing || shellMorphing ? INSTANT : contentSwapTransition
                    }
                    className="popup-info-content"
                  >
                    {displayProduct.previouslyBought && (
                      <div className="badge-popup-wrap">
                        <PreviouslyBoughtBadge variant="popup" />
                      </div>
                    )}

                    <div className="popup-info-body">
                      <h2 className="popup-title">{displayProduct.title}</h2>
                      <p className="popup-size">{displayProduct.size}</p>
                      <div className="popup-price-row">
                        <span className="popup-price">{displayProduct.price}</span>
                        <span className="popup-mrp">{displayProduct.mrp}</span>
                      </div>
                      <p className="popup-eta">{displayProduct.eta}</p>
                    </div>

                    <motion.button
                      type="button"
                      className="view-details"
                      initial={false}
                      animate={{
                        opacity: scrollDrivenStyles
                          ? expandLayout.viewDetailsOpacity(visualProgress)
                          : 1,
                      }}
                      transition={scrollDrivenStyles ? INSTANT : popupContentFadeIn}
                      style={{
                        pointerEvents:
                          scrollDrivenStyles && visualProgress > 0 && visualProgress < 1
                            ? 'none'
                            : 'auto',
                      }}
                    >
                      <span>View Product Details</span>
                      <img src={assetUrl('/assets/icons/chevron-down.svg')} alt="" aria-hidden />
                    </motion.button>
                  </motion.div>
                </div>
              )}
            </div>

            {showInfoContent && (
              <motion.div
                className="popup-below-fold"
                initial={{ opacity: 0 }}
                animate={{ opacity: closing ? closeContentOpacity : contentSwapOpacity }}
                transition={closing ? CLOSE_SETTLE_CROSSFADE : contentSwapTransition}
              >
                {displayProduct.brand && (
                  <div className={`brand-section ${belowFoldPdp ? 'is-pdp' : ''}`}>
                    <div className="brand-card">
                      <div className="brand-logo-wrap">
                        <img src={displayProduct.brand.logo} alt={displayProduct.brand.name} />
                      </div>
                      <div className="brand-text">
                        <p className="brand-name">{displayProduct.brand.name}</p>
                        <p className="brand-sub">{displayProduct.brand.subtitle}</p>
                      </div>
                      <img
                        className="brand-chevron"
                        src={assetUrl('/assets/icons/chevron-right-green.svg')}
                        alt=""
                        aria-hidden
                      />
                    </div>
                  </div>
                )}

                <section className={`rec-section ${belowFoldPdp ? 'is-pdp' : ''}`}>
                  <h3 className="rec-heading">Previously Bought</h3>
                  <p className="rec-subheading">A curated list of your favourites</p>
                  <div className="rec-scroll">
                    {recommendations.map((item) => (
                      <div key={item.id} className="rec-card">
                        <div
                          className={`rec-card-media ${item.heroBg === 'cream' ? 'hero-cream' : 'hero-tan'}`}
                        >
                          <div className="rec-card-img-wrap">
                            <img
                              className="rec-card-img"
                              src={item.images[0]?.src}
                              alt={item.title}
                            />
                          </div>
                          <span className="rec-card-size">{item.size}</span>
                        </div>
                        <div className="rec-card-info">
                          <div className="rec-price-row">
                            <span className="rec-price">{item.price}</span>
                            <span className="rec-mrp">{item.mrp}</span>
                          </div>
                          <p className="rec-title">{item.title}</p>
                          <div className="rec-card-footer">
                            <p className="rec-eta">{item.eta}</p>
                            <button type="button" className="rec-add-btn">
                              ADD
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="view-all-row">
                    <div className="view-all-avatars">
                      <img src={assetUrl('/assets/brands/brand-avatar-1.png')} alt="" />
                      <img src={assetUrl('/assets/brands/brand-avatar-2.png')} alt="" />
                      <img src={assetUrl('/assets/suggestions/suggestion-1.png')} alt="" />
                    </div>
                    <span>View All Products</span>
                  </div>
                </section>
              </motion.div>
            )}
          </motion.div>

          {showInfoContent && (
            <motion.div
              className={`cart-bar ${closing ? 'is-closing' : ''}`}
              style={cartBarStyle}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: closing ? closeContentOpacity : contentSwapOpacity,
                y: 0,
              }}
              transition={closing ? CLOSE_SETTLE_CROSSFADE : contentSwapTransition}
            >
              <div className="cart-price-block">
                <div className="cart-price-row">
                  <span className="cart-price">{displayProduct.price}</span>
                  <span className="cart-mrp">MRP {displayProduct.mrp}</span>
                </div>
                <span className="cart-tax">Inclusive of all taxes</span>
              </div>
              <button type="button" className="cart-btn">
                ADD TO CART
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
