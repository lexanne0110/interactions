import { useEffect } from 'react';
import { CartScreen } from '../../cart/CartScreen';
import { billLiquorItems } from '../../cart/cartData';
import { liquorScenario } from '../../cart/scenario';

/**
 * bill-liquor — the liquor handling charge arriving, leaving, and waiving in
 * happy hour.
 *
 * Starts with six bottles (₹966 of liquor) and happy hour on, so the ₹69 is
 * charged and one tap up crosses ₹999 and waives it. Stepping the bottle to 0
 * removes the line. The other fees stay waived throughout, so the only row
 * that moves is the one being demonstrated.
 */
export function BillLiquorInteraction() {
  // Leaving resets the scenario, so every visit starts from the same cart.
  useEffect(() => () => liquorScenario.reset(), []);
  return (
    <CartScreen
      sections={['items', 'bill']}
      initialItems={billLiquorItems}
      scenario={liquorScenario}
      billOpen
    />
  );
}
