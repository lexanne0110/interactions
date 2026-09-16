import { CartScreen } from '../../cart/CartScreen';

/**
 * incognito-toggle — flip the switch in the header.
 *
 * The chrome is the subject, so the sections stay: the point of the
 * interaction is that the whole screen shifts under a header that grows,
 * and with one card on screen there would be nothing to shift.
 */
export function IncognitoToggleInteraction() {
  return <CartScreen sections={['items', 'wallet', 'bill']} />;
}
