export const openEase = [0, 0, 0.2, 1] as const;
export const closeEase = [0.4, 0, 0.2, 1] as const;

export const openTransition = { duration: 0.36, ease: openEase };
export const closeTransition = { duration: 0.45, ease: closeEase };

/** Card leaf elements — fade out quickly as expand begins */
export const cardLeafFadeOut = { duration: 0.12, ease: openEase };

/** Popup content — fade in after shell morph is ~50% done */
export const popupContentFadeIn = { duration: 0.24, ease: openEase, delay: 0.16 };


/** Carousel track snap after drag release — ease-out, no overshoot */
export const carouselSnapEase = [0.25, 1, 0.35, 1] as const;

const SNAP_MIN_S = 0.26;
const SNAP_MAX_S = 0.42;

/**
 * Snap duration derived from the distance still to travel and how hard the user flicked.
 *
 * A hard flick should finish quickly; a slow drag released just past the threshold should
 * ease in. `velocityPxPerSec` is the release velocity — its sign is ignored, only its
 * magnitude matters, and a stationary release falls back to the slow end of the range.
 */
export function carouselSnapTransition(
  distancePx: number,
  velocityPxPerSec: number,
) {
  const distance = Math.abs(distancePx);
  const speed = Math.abs(velocityPxPerSec);

  if (distance < 1) return { duration: SNAP_MIN_S, ease: carouselSnapEase };

  // Time the gesture would take to cover the remaining distance at its own speed.
  const natural = speed > 0 ? distance / speed : SNAP_MAX_S;
  const duration = Math.min(SNAP_MAX_S, Math.max(SNAP_MIN_S, natural));

  return { duration, ease: carouselSnapEase };
}

/** Popup content — fade out at morph start (mirror of cardLeafFadeOut on open) */
export const popupContentFadeOut = { duration: 0.15, ease: closeEase };

/** Card preview — fades in as popup content clears */
export const popupClosePreviewFadeIn = { duration: 0.15, ease: closeEase };

/** Card leaf elements — fade back in as reverse morph begins */
export const cardLeafFadeIn = { duration: 0.22, ease: closeEase };

export function layoutTransition(closing: boolean) {
  return closing ? closeTransition : openTransition;
}


export function popupContentTransition(closing: boolean) {
  if (closing) return popupContentFadeOut;
  return popupContentFadeIn;
}

/** Add-button stepper — morph spring for organic mobile feel */
export const stepperMorphSpring = {
  type: 'spring' as const,
  stiffness: 480,
  damping: 32,
};

/** Add-button stepper — ADD ↔ controls crossfade */
export const stepperMorphFade = { duration: 0.2, ease: openEase };

/** Add-button stepper — count / MAX label slide + crossfade (gradual drift) */
export const stepperCountEase = [0.4, 0, 0.2, 1] as const;

export const stepperCountYTransition = { duration: 0.35, ease: stepperCountEase };

export const stepperCountEnterTransition = {
  y: stepperCountYTransition,
  opacity: { duration: 0.38, ease: stepperCountEase },
  fontSize: stepperCountYTransition,
  letterSpacing: stepperCountYTransition,
};

export const stepperCountExitTransition = {
  y: stepperCountYTransition,
  opacity: { duration: 0.36, ease: stepperCountEase },
  fontSize: stepperCountYTransition,
  letterSpacing: stepperCountYTransition,
};

/** Add-button stepper — tap feedback */
export const stepperTapTransition = { duration: 0.18, ease: openEase };
