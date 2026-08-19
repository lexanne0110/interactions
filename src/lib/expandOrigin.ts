import { POPUP } from './expandInterpolation';

export type ExpandOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
};

export type SheetFrame = ExpandOrigin & {
  boxShadow?: string;
};

export type MorphTransform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

/** Map measured card rect → transform on a popup-sized shell (exact rect match). */
export function originToMorphTransform(
  origin: ExpandOrigin,
  target: SheetFrame,
): MorphTransform {
  return {
    x: origin.left - target.left,
    y: origin.top - target.top,
    scaleX: target.width > 0 ? origin.width / target.width : 1,
    scaleY: target.height > 0 ? origin.height / target.height : 1,
  };
}

export const IDENTITY_MORPH: MorphTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
};

export const POPUP_FRAME: SheetFrame = {
  top: POPUP.rootPaddingTop,
  left: (390 - POPUP.sheetWidth) / 2,
  width: POPUP.sheetWidth,
  height: POPUP.sheetHeight,
  borderRadius: POPUP.borderRadius,
};

export const PDP_FRAME: SheetFrame = {
  top: 0,
  left: 0,
  width: 390,
  height: 850,
  borderRadius: 0,
  boxShadow: 'none',
};

function rectToPhoneLocal(rect: DOMRect, phone: HTMLElement): ExpandOrigin {
  const phoneR = phone.getBoundingClientRect();
  const scaleX = phoneR.width / 390;
  const scaleY = phoneR.height / 850;

  return {
    top: (rect.top - phoneR.top) / scaleY,
    left: (rect.left - phoneR.left) / scaleX,
    width: rect.width / scaleX,
    height: rect.height / scaleY,
    borderRadius: 8,
  };
}

/** Map card shell rect → phone-local coordinates (works under dashboard phone scale). */
export function measureExpandOrigin(shellEl: HTMLElement): ExpandOrigin {
  const phone = shellEl.closest('.phone') as HTMLElement | null;
  if (!phone) {
    return {
      top: 0,
      left: 0,
      width: 111,
      height: 154,
      borderRadius: 8,
    };
  }

  return rectToPhoneLocal(shellEl.getBoundingClientRect(), phone);
}

export function popupSheetLeft(width: number) {
  return (390 - width) / 2;
}

/** Gap between the active popup and neighbor peeks. */
export const CAROUSEL_GAP_PX = 20;

/** Standard popup width when centered with peeks on both sides. */
export const CAROUSEL_SHEET_WIDTH = 310;

/** Visible neighbor peek when centered (390 − 310 − 40 = 40 → 20px each side). */
export const CAROUSEL_PEEK_PX =
  (390 - CAROUSEL_SHEET_WIDTH - 2 * CAROUSEL_GAP_PX) / 2;

/** Peek zone + gap on one side. */
export const CAROUSEL_SIDE_INSET = CAROUSEL_PEEK_PX + CAROUSEL_GAP_PX;

/** Screen-edge margin on the side with no neighbor peek. */
export const CAROUSEL_EDGE_INSET = 20;

export type CarouselLayout = {
  /** Active card width (330 on edges, 310 when centered). */
  cardWidth: number;
  /** Width a panel occupies — its own *active* width, so a peek is already the size
   *  it will be once it becomes active. Keeps the post-snap swap pixel-identical. */
  panelWidth: (index: number) => number;
  mainLeft: number;
  panelLeft: (index: number) => number;
};

/** Active card width for an index: 330 at either edge, 310 when centered. */
export function carouselCardWidth(index: number, total: number): number {
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  if (hasPrev && hasNext) return CAROUSEL_SHEET_WIDTH;
  if (hasNext) return 390 - CAROUSEL_EDGE_INSET - CAROUSEL_SIDE_INSET;
  if (hasPrev) return 390 - CAROUSEL_SIDE_INSET - CAROUSEL_EDGE_INSET;
  return POPUP.sheetWidth;
}

/** Resting left edge of the active card at an index. */
function carouselMainLeft(index: number, total: number): number {
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  if (hasPrev && hasNext) return CAROUSEL_SIDE_INSET;
  if (hasNext) return CAROUSEL_EDGE_INSET;
  if (hasPrev) return CAROUSEL_SIDE_INSET;
  return POPUP_FRAME.left;
}

/**
 * Gap and peek only where a neighbor exists; 20px screen-edge inset on the far side.
 *
 * Panels are laid out by walking outward from the active card, each panel taking its
 * own active width. Because a neighbor peek is already the width it will have once
 * active, committing a swipe lands it exactly on the next `mainLeft` — which also makes
 * every travel exactly one stride (330px), in both directions, at every index.
 */
export function carouselTrackLayout(index: number, total: number): CarouselLayout {
  const mainLeft = carouselMainLeft(index, total);
  const cardWidth = carouselCardWidth(index, total);
  const panelWidth = (i: number) => carouselCardWidth(i, total);

  const panelLeft = (i: number): number => {
    if (i === index) return mainLeft;

    if (i > index) {
      let left = mainLeft + cardWidth + CAROUSEL_GAP_PX;
      for (let j = index + 1; j < i; j += 1) {
        left += panelWidth(j) + CAROUSEL_GAP_PX;
      }
      return left;
    }

    let right = mainLeft - CAROUSEL_GAP_PX;
    for (let j = index - 1; j > i; j -= 1) {
      right -= panelWidth(j) + CAROUSEL_GAP_PX;
    }
    return right - panelWidth(i);
  };

  return { cardWidth, panelWidth, mainLeft, panelLeft };
}

/** Drag offset to align target panel when committing a swipe. */
export function carouselCommitDragX(
  fromIndex: number,
  toIndex: number,
  total: number,
): number {
  const fromLayout = carouselTrackLayout(fromIndex, total);
  const toLayout = carouselTrackLayout(toIndex, total);
  return toLayout.mainLeft - fromLayout.panelLeft(toIndex);
}

/** Popup sheet frame for a carousel index (popup mode). */
export function carouselSheetFrame(index: number, total: number): SheetFrame {
  const layout = carouselTrackLayout(index, total);
  return {
    ...POPUP_FRAME,
    left: layout.mainLeft,
    width: layout.cardWidth,
  };
}

/** Re-measure a grid card shell after swipe (open morph origin follows current product). */
export function measureExpandOriginByProductId(productId: string): ExpandOrigin | null {
  const shell = document.querySelector(
    `[data-product-id="${productId}"] .card-expand-shell`,
  ) as HTMLElement | null;
  return shell ? measureExpandOrigin(shell) : null;
}

/** Re-measure the full grid card for close morph (shell + ADD button). */
export function measureCloseOriginByProductId(productId: string): ExpandOrigin | null {
  const card = document.querySelector(
    `[data-product-id="${productId}"]`,
  ) as HTMLElement | null;
  return card ? measureExpandOrigin(card) : null;
}
