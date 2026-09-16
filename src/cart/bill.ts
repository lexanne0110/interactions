import type { CartItem } from './cartData';

/**
 * Cart fee rules.
 *
 * These are business rules from the product team (2026-09-11), not design
 * values, so they live in one pure function that the bill, the footer and the
 * header all read. Nothing on screen computes money on its own.
 *
 * - Delivery ₹30, free when the item total is above ₹199 — ₹149 for My Spencers
 *   Rewards (MSR) members.
 * - Small cart fee ₹30, waived above ₹99.
 * - Packing charge is always waived.
 * - Liquor handling ₹69, and only while liquor is in the cart. During happy hour
 *   it is waived once the liquor in the cart is above ₹999.
 *
 * Thresholds check the **item total** — what the items cost after their own
 * price cuts, before coupons or wallet — so applying a coupon can never bring a
 * fee back. "Above" is strict: an item total of exactly ₹199 still pays delivery.
 */
export const FEES = { delivery: 30, smallCart: 30, packing: 10, liquorHandling: 69 } as const;

export const THRESHOLDS = {
  delivery: 199,
  deliveryMsr: 149,
  smallCart: 99,
  happyHourLiquor: 999,
} as const;

/**
 * Fixed lines carried over from the Figma bill; their rules are not specified
 * yet. The promo is capped at the item total purely so a small cart cannot go
 * negative — revisit once the real promo rule is known.
 */
export const PROMO_DISCOUNT = 100;
export const GST_AND_CHARGES = 9;

export type Fee = {
  /** What the fee would be if it applied — shown struck through when waived. */
  list: number;
  /** What is actually charged: `list`, or 0 when waived. */
  charged: number;
  waived: boolean;
};

export type BillInput = {
  items: CartItem[];
  msr: boolean;
  happyHour: boolean;
  couponSavings: number;
  walletApplied: number;
};

export type Bill = {
  itemTotal: number;
  itemMrpTotal: number;
  liquorTotal: number;
  /** ₹199, or ₹149 for MSR members. */
  deliveryThreshold: number;
  delivery: Fee;
  smallCart: Fee;
  packing: Fee;
  /** `null` while there is no liquor in the cart: the line does not exist. */
  liquorHandling: Fee | null;
  promo: number;
  gst: number;
  /**
   * "You saved": item price cuts plus coupons. This follows the Figma bill,
   * where ₹48 is exactly ₹709 − ₹661. Wallet balance is the shopper's own money
   * and never counts; waived fees already read as savings through their strike.
   */
  saved: number;
  payable: number;
};

const fee = (list: number, waived: boolean): Fee => ({ list, charged: waived ? 0 : list, waived });

export function computeBill({ items, msr, happyHour, couponSavings, walletApplied }: BillInput): Bill {
  const itemTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemMrpTotal = items.reduce((s, i) => s + (i.was ?? i.price) * i.qty, 0);
  const liquorTotal = items.filter((i) => i.liquor).reduce((s, i) => s + i.price * i.qty, 0);
  const hasItems = itemTotal > 0;
  const hasLiquor = items.some((i) => i.liquor && i.qty > 0);

  const deliveryThreshold = msr ? THRESHOLDS.deliveryMsr : THRESHOLDS.delivery;
  // An empty cart has nothing to deliver, so no fee applies to it.
  const delivery = fee(FEES.delivery, !hasItems || itemTotal > deliveryThreshold);
  const smallCart = fee(FEES.smallCart, !hasItems || itemTotal > THRESHOLDS.smallCart);
  const packing = fee(FEES.packing, true);
  const liquorHandling = hasLiquor
    ? fee(FEES.liquorHandling, happyHour && liquorTotal > THRESHOLDS.happyHourLiquor)
    : null;

  const promo = Math.min(PROMO_DISCOUNT, itemTotal);
  const gst = hasItems ? GST_AND_CHARGES : 0;
  const saved = itemMrpTotal - itemTotal + couponSavings;
  const charges =
    delivery.charged + smallCart.charged + packing.charged + (liquorHandling?.charged ?? 0);
  const payable = Math.max(0, itemTotal - promo + charges + gst - couponSavings - walletApplied);

  return {
    itemTotal, itemMrpTotal, liquorTotal, deliveryThreshold,
    delivery, smallCart, packing, liquorHandling,
    promo, gst, saved, payable,
  };
}
