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

/** Visible strip of the next/prev popup sheet in the swipe carousel. */
export const CAROUSEL_PEEK_PX = 36;

export function popupCarouselSheetLeft(
  sheetWidth: number,
  hasNext: boolean,
  hasPrev: boolean,
): number {
  if (hasNext) return 390 - sheetWidth - CAROUSEL_PEEK_PX;
  if (hasPrev) return CAROUSEL_PEEK_PX;
  return popupSheetLeft(sheetWidth);
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
