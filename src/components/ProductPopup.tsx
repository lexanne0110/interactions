import { assetUrl } from '../lib/assetUrl';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
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
  carouselTrackLayout,
  originToMorphTransform,
  popupSheetLeft,
} from '../lib/expandOrigin';
import {
  carouselSnapTransition,
  closeTransition,
  openTransition,
  popupContentFadeOut,
  popupContentFadeIn,
} from '../lib/transitions';
import {
  commitTrackX,
  createVelocityTracker,
  resolveSwipeCommit,
  rubberBandDragX,
} from '../lib/carouselDrag';

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
const DRAG_AXIS_LOCK_PX = 8;
/**
 * Popup content ↔ card preview crossfade during close.
 *
 * Held until the sheet is essentially card-sized, then swapped fast.
 *
 * The preview fills the sheet so it lands exactly on the grid card, but the content inside
 * it (hero image, text, ADD) is at fixed card pixel sizes. While the sheet is still larger
 * than a card, that reads as an "exploded" card: correctly-proportioned boxes with tiny
 * content floating in empty space. Crossfading at 45% (as this used to) put that skeleton
 * on screen at ~2x card size for a third of the close — the single most visible glitch.
 *
 * At 80% the eased morph is ~96% done (sheet ~123x310 vs the card's 111x277), so the
 * preview appears already card-shaped and the last 7% just settles it in.
 */
const CLOSE_SETTLE_TIMES = [0, 0.8, 0.93, 1];
const CLOSE_SETTLE_CROSSFADE = {
  duration: closeTransition.duration,
  times: CLOSE_SETTLE_TIMES,
  ease: closeTransition.ease,
};
/** Fraction of the close at which the preview is fully opaque and content can be hidden. */
const CLOSE_SWAP_AT = 0.93;
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
  const [previewHandoffActive, setPreviewHandoffActive] = useState(false);
  const [closePreviewVisible, setClosePreviewVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suppressExpandRef = useRef(false);
  const closeDoneRef = useRef(false);
  const closeMorphReadyAtRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipePointerIdRef = useRef<number | null>(null);
  const swipeCommittedRef = useRef(false);
  const dragAxisRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const velocityTrackerRef = useRef(createVelocityTracker());
  const releaseVelocityRef = useRef(0);
  /** Distance the track still has to cover once the finger lifts — drives snap duration. */
  const snapDistanceRef = useRef(0);
  const pendingSwipeRef = useRef<'left' | 'right' | null>(null);
  const [trackX, setTrackXState] = useState(0);
  const trackXRef = useRef(0);
  const [trackSnapping, setTrackSnapping] = useState(false);
  const [isCarouselDragging, setIsCarouselDragging] = useState(false);
  const trackSnappingRef = useRef(false);

  const setDragTrackX = useCallback((value: number) => {
    trackXRef.current = value;
    setTrackXState(value);
  }, []);
  const openedOnceRef = useRef(false);
  const prevClosingRef = useRef(false);
  const closingSnapshotRef = useRef<{
    visualProgress: number;
    frame: SheetFrame;
    wasScrollDriven: boolean;
  } | null>(null);
  /**
   * The frame the sheet is actually resting at while open — the carousel frame
   * (e.g. left 40 / width 330), not the generic centred POPUP_FRAME. Written on every
   * non-closing render, so the close snapshot below can read the frame from the last
   * open render rather than recomputing it after `closing` has already disabled the
   * carousel layout.
   */
  const restingFrameRef = useRef<SheetFrame>(POPUP_FRAME);
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
    // At progress 0 the sheet is sitting at its carousel frame, NOT the centred
    // POPUP_FRAME. Snapshotting POPUP_FRAME here made the sheet jump sideways and widen
    // at the first close frame, and computed the collapse trajectory from a centred
    // origin — so a right-hand card appeared to collapse toward the left of the grid.
    const frame =
      progress >= 1
        ? PDP_FRAME
        : progress > 0
          ? sheetFrameAtProgress(progress)
          : restingFrameRef.current;

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
  const inCarousel = !!onSwipe && carousel.index >= 0;
  const trackLayout = useMemo(
    () => carouselTrackLayout(carousel.index, carousel.total),
    [carousel.index, carousel.total],
  );
  const useCarouselLayout =
    inCarousel && !closing && mode === 'popup' && !scrollEngaged;
  const showCarousel = useCarouselLayout && morphComplete;
  // Peeks stay mounted across scroll-engage and close so the track never changes
  // element type — a type change here would remount .popup-sheet and .popup-scroll,
  // destroying scroll position mid-expand. Visibility is driven by opacity instead.
  const peeksMounted = inCarousel && mode === 'popup';
  const popupFrame: SheetFrame = useCarouselLayout
    ? { ...POPUP_FRAME, left: trackLayout.mainLeft, width: trackLayout.cardWidth }
    : POPUP_FRAME;
  const canSwipe = showCarousel;

  // Remember where the sheet actually rests, so the close snapshot above (which runs on
  // the first render where `closing` is already true) can collapse from the real frame.
  if (!closing) {
    restingFrameRef.current = popupFrame;
  }

  const morphFrom = useMemo(
    () => originToMorphTransform(expandOrigin, popupFrame),
    [expandOrigin, popupFrame],
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
  // `popupFrame` depends only on the carousel index, so the only thing that can change it
  // is a product swap — and on a swap the incoming peek already sits exactly where the
  // sheet lands (same left, same width), so the change must be instant to stay seamless.
  // Animating it here is what used to produce the post-snap 20px slide/resize hitch.
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

  /**
   * Hand the card back to the grid once the close morph has landed.
   *
   * Idempotent via `closeDoneRef`. The timer below is the authoritative trigger because
   * it does not depend on framer firing a callback; `onAnimationComplete` is only an
   * earlier opportunity, and framer can fire it spuriously mid-morph — hence the elapsed
   * check, which rejects any call before the morph could plausibly have finished.
   */
  const beginCloseHandoff = useCallback(() => {
    if (closeDoneRef.current) return;
    const readyAt = closeMorphReadyAtRef.current;
    if (!readyAt) return;
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
    // Hide the scroll layer only once the preview has finished fading in, never before.
    const swapMs = CLOSE_MORPH_MS * CLOSE_SWAP_AT;
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
      dragAxisRef.current = 'none';
      velocityTrackerRef.current.reset();
      releaseVelocityRef.current = 0;
      pendingSwipeRef.current = null;
      setDragTrackX(0);
      trackXRef.current = 0;
      setTrackSnapping(false);
      setIsCarouselDragging(false);
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

  useEffect(() => {
    trackSnappingRef.current = trackSnapping;
  }, [trackSnapping]);

  useEffect(() => {
    if (!showCarousel) {
      setDragTrackX(0);
      trackXRef.current = 0;
      setTrackSnapping(false);
      setIsCarouselDragging(false);
      dragAxisRef.current = 'none';
    }
  }, [showCarousel]);

  const resetCarouselDrag = useCallback(() => {
    swipeStartRef.current = null;
    dragAxisRef.current = 'none';
    velocityTrackerRef.current.reset();
    setIsCarouselDragging(false);
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canSwipe || event.button !== 0 || swipeCommittedRef.current || trackSnapping) return;
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, [role="button"]')) return;
      swipeStartRef.current = { x: event.clientX, y: event.clientY };
      swipePointerIdRef.current = event.pointerId;
      dragAxisRef.current = 'none';
      velocityTrackerRef.current.reset();
      velocityTrackerRef.current.add(event.clientX, performance.now());
      releaseVelocityRef.current = 0;
      // Throws if the pointer is already gone by the time we handle the event. Capture is
      // an optimisation (it keeps moves coming if the finger leaves the sheet), not a
      // requirement — losing it must not take the whole gesture down with it.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* pointer no longer active — drag still works without capture */
      }
    },
    [canSwipe, trackSnapping],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canSwipe || !swipeStartRef.current || swipePointerIdRef.current !== event.pointerId) {
        return;
      }

      const dx = event.clientX - swipeStartRef.current.x;
      const dy = event.clientY - swipeStartRef.current.y;

      if (dragAxisRef.current === 'none') {
        if (Math.abs(dx) < DRAG_AXIS_LOCK_PX && Math.abs(dy) < DRAG_AXIS_LOCK_PX) return;
        if (Math.abs(dx) <= Math.abs(dy)) {
          resetCarouselDrag();
          return;
        }
        dragAxisRef.current = 'horizontal';
        setIsCarouselDragging(true);
        setTrackSnapping(false);
      }

      if (dragAxisRef.current !== 'horizontal') return;

      event.preventDefault();
      velocityTrackerRef.current.add(event.clientX, performance.now());
      setDragTrackX(rubberBandDragX(dx, carousel.index, carousel.total));
    },
    [canSwipe, carousel.index, carousel.total, resetCarouselDrag],
  );

  const finishCarouselDrag = useCallback(() => {
    if (!canSwipe || dragAxisRef.current !== 'horizontal') {
      resetCarouselDrag();
      return;
    }

    dragAxisRef.current = 'none';
    setIsCarouselDragging(false);

    const velocity = velocityTrackerRef.current.velocity();
    releaseVelocityRef.current = velocity;

    const commit = resolveSwipeCommit(
      trackXRef.current,
      velocity,
      carousel.index,
      carousel.total,
    );

    const snapToTrackX = (target: number, direction: 'left' | 'right' | null) => {
      snapDistanceRef.current = target - trackXRef.current;
      if (direction) {
        swipeCommittedRef.current = true;
        pendingSwipeRef.current = direction;
      }
      trackSnappingRef.current = true;
      setTrackSnapping(true);
      setDragTrackX(target);
    };

    if (commit === 'next' && carousel.next) {
      snapToTrackX(commitTrackX(carousel.index, carousel.index + 1, carousel.total), 'right');
      return;
    }

    if (commit === 'prev' && carousel.prev) {
      snapToTrackX(commitTrackX(carousel.index, carousel.index - 1, carousel.total), 'left');
      return;
    }

    snapToTrackX(0, null);
  }, [canSwipe, carousel.index, carousel.next, carousel.prev, carousel.total, resetCarouselDrag, setDragTrackX]);

  const handleTrackAnimationComplete = useCallback(() => {
    if (!trackSnappingRef.current) return;

    const pending = pendingSwipeRef.current;
    pendingSwipeRef.current = null;
    swipeCommittedRef.current = false;
    trackSnappingRef.current = false;

    if (pending) {
      // One synchronous commit: swap the product, zero the track and drop out of snapping
      // together, so the sheet's new frame and the track reset land in the same paint.
      flushSync(() => {
        onSwipe?.(pending);
        setDragTrackX(0);
        setTrackSnapping(false);
      });
    } else {
      setTrackSnapping(false);
    }

    resetCarouselDrag();
  }, [onSwipe, resetCarouselDrag, setDragTrackX]);

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      finishCarouselDrag();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      swipePointerIdRef.current = null;
    },
    [finishCarouselDrag],
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const releaseCapture = () => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        swipePointerIdRef.current = null;
      };

      // The browser cancels the pointer for reasons unrelated to intent (scroll takeover,
      // touch-action change, the pointer leaving the window). If the swipe was already
      // committed the finger is no longer driving anything — let the snap finish rather
      // than silently discarding a swipe the user completed.
      if (swipeCommittedRef.current) {
        releaseCapture();
        return;
      }

      resetCarouselDrag();
      pendingSwipeRef.current = null;
      snapDistanceRef.current = -trackXRef.current;
      trackSnappingRef.current = true;
      setTrackSnapping(true);
      setDragTrackX(0);
      releaseCapture();
    },
    [resetCarouselDrag, setDragTrackX],
  );

  // Swap is a plain text/image substitution — the incoming peek already showed this exact
  // card at this exact position and width, so any crossfade here would flicker content
  // that is already correct on screen.
  useEffect(() => {
    if (product.id === displayProduct.id) return;
    setDisplayProduct(product);
  }, [product, displayProduct.id]);

  const belowFoldPdp = visualProgress >= 1;
  // Only ever animates on first open (initial opacity 0 -> 1); a swap leaves it at 1.
  const contentSwapTransition = popupContentFadeIn;
  const contentSwapOpacity = closing && previewHandoffActive ? 0 : 1;
  const chromeFadeTransition = closing
    ? popupContentFadeOut
    : { duration: 0.28, ease: [0, 0, 0.2, 1] as const };
  const transformFrame = closing ? closeTargetFrame : popupFrame;
  const closeContentOpacity = closing ? [1, 1, 0, 0] : 1;
  const closePreviewOpacity = closing ? [0, 0, 1, 1] : 0;
  const closeTransformInitial =
    morphCloseActive && (closingSnapshot?.wasScrollDriven ?? false)
      ? { ...IDENTITY_MORPH, borderRadius: closeTargetFrame.borderRadius }
      : false;

  // The track is ALWAYS a motion.div. Behavior is gated, structure never is.
  const trackTransition = trackSnapping
    ? carouselSnapTransition(snapDistanceRef.current, releaseVelocityRef.current)
    : INSTANT;

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
        className={`popup-root ${showPdpLayout ? 'is-pdp' : ''} ${scrollDrivenStyles ? 'is-scroll-linked' : ''} ${shellMorphing ? 'is-morphing' : ''} ${showCarousel ? 'is-carousel' : ''} ${isCarouselDragging ? 'is-carousel-dragging' : ''}`}
        style={rootStyle}
      >
        <motion.div
          className={`popup-carousel-track${isCarouselDragging ? ' is-dragging' : ''}`}
          animate={{ x: showCarousel ? trackX : 0 }}
          transition={trackTransition}
          onAnimationComplete={handleTrackAnimationComplete}
        >
        {peeksMounted && carousel.prev && (
              <PopupCarouselPeek
                product={carousel.prev}
                side="left"
                left={trackLayout.panelLeft(carousel.index - 1)}
                width={trackLayout.panelWidth(carousel.index - 1)}
                index={carousel.index - 1}
                visible={showCarousel}
              />
        )}
        {peeksMounted && carousel.next && (
              <PopupCarouselPeek
                product={carousel.next}
                side="right"
                left={trackLayout.panelLeft(carousel.index + 1)}
                width={trackLayout.panelWidth(carousel.index + 1)}
                index={carousel.index + 1}
                visible={showCarousel}
              />
        )}

        <motion.div
          ref={sheetRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`popup-sheet ${showPdpLayout ? 'is-pdp' : ''} ${scrollDrivenStyles ? 'is-scroll-driven' : ''} ${useTransformMorph ? 'is-morphing' : ''} ${closing ? 'is-closing' : ''} ${closePreviewVisible ? 'is-preview-swap' : ''} ${showCarousel ? 'is-carousel-active' : ''} ${isCarouselDragging ? 'is-dragging' : ''}`}
          initial={
            isOpenMorphing
              ? { ...morphFrom, borderRadius: expandOrigin.borderRadius }
              : closeTransformInitial
          }
          animate={
            useTransformMorph
              ? morphCloseActive
                ? {
                    // NO `x: 0` here. `closeMorphFrom.x` is the morph's horizontal
                    // translation (origin.left - target.left); overriding it meant the sheet
                    // only ever animated y/scale and shrank toward its own left edge, so
                    // every product appeared to collapse onto the left-hand card. The
                    // carousel track offset is reset on the track itself, not the sheet.
                    ...closeMorphFrom,
                    borderRadius: expandOrigin.borderRadius,
                  }
                : {
                    ...IDENTITY_MORPH,
                    borderRadius: POPUP_FRAME.borderRadius,
                    x: 0,
                    top: transformFrame.top,
                    left: transformFrame.left,
                    width: transformFrame.width,
                    height: transformFrame.height,
                  }
              : {
                  top: sheetFrame.top,
                  left: sheetFrame.left,
                  width: sheetFrame.width,
                  height: sheetFrame.height,
                  borderRadius: sheetFrame.borderRadius,
                  x: 0,
                }
          }
          transition={useTransformMorph ? transformTransition : sheetTransition}
          onAnimationComplete={() => {
            if (isOpenMorphing) {
              setMorphComplete(true);
            } else if (morphCloseActive) {
              beginCloseHandoff();
            }
          }}
          style={{
            position: 'absolute',
            transformOrigin: 'top left',
            ...(useCarouselLayout && !isOpenMorphing && !morphCloseActive
              ? {
                  top: popupFrame.top,
                  left: popupFrame.left,
                  width: popupFrame.width,
                  height: popupFrame.height,
                }
              : useTransformMorph && (isOpenMorphing || morphCloseActive)
                ? {
                    top: isOpenMorphing ? popupFrame.top : transformFrame.top,
                    left: isOpenMorphing ? popupFrame.left : transformFrame.left,
                    width: isOpenMorphing ? popupFrame.width : transformFrame.width,
                    height: isOpenMorphing ? popupFrame.height : transformFrame.height,
                  }
                : {}),
            // Faded via the CSS transition on .popup-sheet.is-closing rather than removed
            // outright, which used to snap the 40px shadow off on the first close frame.
            boxShadow: closing
              ? '0 0px 0px rgba(16, 24, 40, 0)'
              : (sheetFrame.boxShadow ?? '0 8px 40px rgba(16, 24, 40, 0.12)'),
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
                    // Deliberately NOT INSTANT while the shell morphs. Popping this in at
                    // contentReady while .cart-bar was still waiting out popupContentFadeIn's
                    // delay left the title and price on screen ~400ms before the CTA arrived.
                    // Both now share one reveal.
                    transition={closing ? INSTANT : contentSwapTransition}
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

          {/* Always mounted. `.cart-bar` is an 81px normal-flow flex child, so gating it on
              contentReady collapsed .popup-scroll by 81px partway through the open morph.
              Its space is now reserved from the first frame and only opacity animates. */}
          <motion.div
              className={`cart-bar ${closing ? 'is-closing' : ''}`}
              // Mounted from frame one but invisible until contentReady — don't let it
              // swallow taps while it is at opacity 0.
              style={{ ...cartBarStyle, pointerEvents: showInfoContent && !closing ? 'auto' : 'none' }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: closing
                  ? closeContentOpacity
                  : showInfoContent
                    ? contentSwapOpacity
                    : 0,
              }}
              transition={closing ? CLOSE_SETTLE_CROSSFADE : contentSwapTransition}
              aria-hidden={!showInfoContent}
            >
              <div className="cart-price-block">
                <div className="cart-price-row">
                  <span className="cart-price">{displayProduct.price}</span>
                  <span className="cart-mrp">MRP {displayProduct.mrp}</span>
                </div>
                <span className="cart-tax">Inclusive of all taxes</span>
              </div>
              <button type="button" className="cart-btn" tabIndex={showInfoContent ? 0 : -1}>
                ADD TO CART
              </button>
            </motion.div>
        </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
