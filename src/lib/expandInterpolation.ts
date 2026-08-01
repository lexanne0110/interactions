/** Scroll-driven popup → PDP morph — keep in sync with tokens.css */

export const SCROLL_THRESHOLD = 80;
export const EXPAND_RANGE = 200;

/** When hero/chrome switches from popup → PDP styling (before full commit) */
export const CHROME_CROSSOVER = 0.88;

/** Popup (p=0) and PDP (p=1) layout anchors */
export const POPUP = {
  sheetWidth: 352,
  sheetHeight: 797,
  borderRadius: 11.237,
  rootPaddingTop: 26,
  heroHeight: 368,
  infoMarginTop: 12,
  infoMarginH: 12,
  heroControlTop: 16,
  cartBarBottom: 19,
  cartBarBorderRadius: 11.237,
} as const;

const PDP = {
  sheetWidth: 390,
  sheetHeight: 850,
  borderRadius: 0,
  rootPaddingTop: 0,
  heroHeight: 422,
  infoMarginTop: 16,
  infoMarginH: 16,
  heroControlTop: 42,
  cartBarBottom: 0,
  cartBarBorderRadius: 0,
} as const;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

/** Round to whole pixels to avoid subpixel layout jitter */
export function roundPx(value: number) {
  return Math.round(value);
}

/** Smoothstep eases the morph so expansion feels gradual, not linear/jumpy */
export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function scrollToProgress(scrollTop: number) {
  if (scrollTop < SCROLL_THRESHOLD) return 0;
  const linear = clamp((scrollTop - SCROLL_THRESHOLD) / EXPAND_RANGE, 0, 1);
  return easeInOutCubic(linear);
}

function lerpPx(from: number, to: number, progress: number) {
  return roundPx(lerp(from, to, progress));
}

/** Interpolated layout values keyed by scroll progress (0 = popup, 1 = PDP) */
export const expandLayout = {
  sheetWidth: (p: number) => lerpPx(POPUP.sheetWidth, PDP.sheetWidth, p),
  sheetHeight: (p: number) => lerpPx(POPUP.sheetHeight, PDP.sheetHeight, p),
  borderRadius: (p: number) => roundPx(lerp(POPUP.borderRadius, PDP.borderRadius, p) * 1000) / 1000,
  rootPaddingTop: (p: number) => lerpPx(POPUP.rootPaddingTop, PDP.rootPaddingTop, p),
  heroHeight: (p: number) => lerpPx(POPUP.heroHeight, PDP.heroHeight, p),
  infoMarginTop: (p: number) => lerpPx(POPUP.infoMarginTop, PDP.infoMarginTop, p),
  infoMarginH: (p: number) => lerpPx(POPUP.infoMarginH, PDP.infoMarginH, p),
  heroControlTop: (p: number) => lerpPx(POPUP.heroControlTop, PDP.heroControlTop, p),
  cartBarBottom: (p: number) => lerpPx(POPUP.cartBarBottom, PDP.cartBarBottom, p),
  cartBarBorderRadius: (p: number) =>
    roundPx(lerp(POPUP.cartBarBorderRadius, PDP.cartBarBorderRadius, p) * 1000) / 1000,
  statusBarOpacity: (p: number) => p,
  backdropOpacity: (p: number) => roundPx(lerp(1, 0, p) * 1000) / 1000,
  viewDetailsOpacity: (p: number) => {
    if (p <= 0 || p >= 1) return 1;
    if (p < 0.75) return roundPx(lerp(1, 0, p / 0.75) * 1000) / 1000;
    return roundPx(lerp(0, 1, (p - 0.75) / 0.25) * 1000) / 1000;
  },
  boxShadowAlpha: (p: number) => roundPx(lerp(0.12, 0, p) * 1000) / 1000,
} as const;
