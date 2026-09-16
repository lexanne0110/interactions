import { CartScreen } from '../../cart/CartScreen';

/**
 * coupon-apply — tap APPLY on the Navi coupon.
 *
 * Coupons only. The footer's Pay amount still rolls, so the consequence is
 * visible without the bill competing for attention.
 */
export function CouponApplyInteraction() {
  return <CartScreen sections={['coupons']} />;
}
