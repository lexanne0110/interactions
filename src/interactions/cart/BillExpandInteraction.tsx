import { CartScreen } from '../../cart/CartScreen';

/**
 * bill-expand — tap the bill to open and close it.
 *
 * Renders header, bill card and footer only — the other eight sections are not
 * part of this transition and would just be scroll noise around it. The bill is
 * calculated from Figma's full cart, so the liquor handling line is there too.
 *
 * Fee changes have their own prototypes — `bill-charges` and `bill-liquor` —
 * so this one stays about the expand.
 *
 * The motion itself lives in BillCard, not here: the screen and the prototype
 * have to be the same component, or the reference drifts from what ships.
 */
export function BillExpandInteraction() {
  return <CartScreen sections={['bill']} />;
}
