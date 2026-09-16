import { useEffect } from 'react';
import { CartScreen } from '../../cart/CartScreen';
import { billChargesItems } from '../../cart/cartData';
import { chargesScenario } from '../../cart/scenario';

/**
 * bill-charges — step items and watch delivery and the small cart fee apply
 * and waive.
 *
 * Two items and the bill, opened: the fees react to the item total, so the
 * steppers that move it and the rows they change have to share the screen.
 * The cart starts at ₹235, above every threshold. Step Apple to 0 and both
 * fees come back at ₹98; step Rice Stick to 2 (₹196) and 3 (₹294) to waive
 * the small cart fee, then delivery.
 */
export function BillChargesInteraction() {
  // Leaving resets the scenario, so every visit starts from the same cart.
  useEffect(() => () => chargesScenario.reset(), []);
  return (
    <CartScreen
      sections={['items', 'bill']}
      initialItems={billChargesItems}
      scenario={chargesScenario}
      billOpen
    />
  );
}
