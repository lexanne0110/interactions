import { CartScreen } from '../../cart/CartScreen';

/**
 * The full cart, carrying every finished interaction.
 *
 * The motion lives in the section components, so each prototype and this screen
 * run the same code — as interactions are finalised they appear here with no
 * extra wiring. Currently live: bill expand + fee tooltips, stepper to zero with
 * row removal, and the empty-cart chain.
 */
export function CartScreenInteraction() {
  return <CartScreen emptyOnZero />;
}
