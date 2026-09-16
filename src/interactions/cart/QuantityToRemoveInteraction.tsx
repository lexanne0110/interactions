import { CartScreen } from '../../cart/CartScreen';

/**
 * quantity-to-remove → cart-empty.
 *
 * One chain, deliberately: stepping the last item to zero is how a cart becomes
 * empty, so the removal and the empty state are demonstrated together rather
 * than as two unrelated states.
 *
 * Only the items section renders, so the collapse is not competing with six
 * other sections for attention — but `emptyOnZero` still runs the full
 * top-down section collapse and slides the footer out.
 */
export function QuantityToRemoveInteraction() {
  return <CartScreen sections={['items']} emptyOnZero />;
}
