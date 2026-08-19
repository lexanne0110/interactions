import { useCallback, useMemo, useState } from 'react';
import { SearchScreen } from '../../components/SearchScreen';
import { MiniCartBar } from '../../components/MiniCartBar';
import { products, type Product } from '../../data/products';
import '../../App.css';

function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function MiniCartInteraction() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  /** Unique product ids in cart, oldest → newest. */
  const [cartOrder, setCartOrder] = useState<string[]>([]);

  const cartItems = useMemo(
    () =>
      cartOrder
        .map((id) => productById(id))
        .filter((p): p is Product => Boolean(p)),
    [cartOrder],
  );

  const handleQuantityChange = useCallback(
    (productId: string, next: number, prev: number) => {
      const newlyAdded = prev === 0 && next > 0;
      const fullyRemoved = prev > 0 && next === 0;

      setQuantities((q) => ({ ...q, [productId]: next }));

      if (newlyAdded) {
        setCartOrder((order) =>
          order.includes(productId) ? order : [...order, productId],
        );
      } else if (fullyRemoved) {
        setCartOrder((order) => order.filter((id) => id !== productId));
      }
    },
    [],
  );

  const showCart = cartOrder.length > 0;

  return (
    <div className="mini-cart-root">
      <div className={`phone-scroll${showCart ? ' has-mini-cart' : ''}`}>
        <SearchScreen
          open={false}
          addButtonVariant="stepper"
          disableExpand
          onExpand={() => {}}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
        />
      </div>

      {/* Kept mounted rather than wrapped in AnimatePresence: a cancelled exit reuses the
          same instance, which stranded the bar's "expanded" state and skipped the open
          choreography when an item was removed and immediately re-added. */}
      <MiniCartBar
        items={cartItems}
        uniqueCount={cartOrder.length}
        visible={showCart}
      />
    </div>
  );
}
