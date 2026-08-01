import { ProductCard } from './ProductCard';
import { SearchBar } from './SearchBar';
import { row1Products, row2Products, searchSuggestions } from '../data/products';
import type { Product } from '../data/products';
import type { ExpandOrigin } from '../lib/expandOrigin';

type Props = {
  open: boolean;
  closing?: boolean;
  closeHandoff?: boolean;
  handoffProductId?: string | null;
  activeProductId?: string | null;
  layoutResetKey?: number;
  onExpand: (product: Product, origin: ExpandOrigin) => void;
  addButtonVariant?: 'default' | 'stepper';
  disableExpand?: boolean;
  quantities?: Record<string, number>;
  onQuantityChange?: (productId: string, next: number, prev: number) => void;
};

export function SearchScreen({
  open,
  closing = false,
  closeHandoff = false,
  handoffProductId = null,
  activeProductId = null,
  layoutResetKey = 0,
  onExpand,
  addButtonVariant = 'default',
  disableExpand = false,
  quantities,
  onQuantityChange,
}: Props) {
  const overlayActive = open || closing || closeHandoff;

  return (
    <div className="search">
      <div className="search-gradient" aria-hidden />

      <div className="status-bar">
        <img className="status-time" src="/assets/icons/time-1047.svg" alt="10:47" />
        <div className="status-icons">
          <img src="/assets/icons/wifi.svg" alt="" aria-hidden />
          <img src="/assets/icons/reception.svg" alt="" aria-hidden />
          <img src="/assets/icons/battery.svg" alt="" aria-hidden />
        </div>
      </div>

      <SearchBar />

      <div className="suggestions content-column">
        {searchSuggestions.map((item) => (
          <div key={item.id} className="suggestion-item">
            <div className="suggestion-thumb">
              <img src={item.image} alt="" />
            </div>
            <span className="suggestion-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="filters content-column">
        <span className="chip chip-active">
          <span>Filters</span>
          <img src="/assets/icons/x-green.svg" alt="" aria-hidden />
        </span>
        <span className="chip chip-active chip-with-thumb">
          <span className="chip-thumb">
            <img src="/assets/suggestions/suggestion-1.png" alt="" />
          </span>
          <span>Aashirvaad</span>
          <img src="/assets/icons/x-green.svg" alt="" aria-hidden />
        </span>
        <span className="chip chip-sort">
          <span>Sort By</span>
          <img src="/assets/icons/chevron-down.svg" alt="" aria-hidden />
        </span>
        <span className="chip">
          <span>Price</span>
          <img src="/assets/icons/chevron-down.svg" alt="" aria-hidden />
        </span>
      </div>

      <div className="product-grid content-column">
        <div className="product-row">
          {row1Products.map((product) => {
            const isActiveTarget = activeProductId === product.id;
            const hideForHandoff = handoffProductId === product.id;
            const isExpandable = product.expandable && !disableExpand;
            // Keep every expandable card hidden while the popup is open so
            // swiping between carousel items never reveals grid text underneath.
            const hideForOpenPopup = open && !closing && isExpandable;
            const hidden =
              hideForHandoff ||
              hideForOpenPopup ||
              (isActiveTarget && closeHandoff);

            return (
              <div key={product.id} className="product-card-slot">
                {hidden && overlayActive && (
                  <div className="card-placeholder" aria-hidden />
                )}
                <ProductCard
                  product={product}
                  layoutResetKey={layoutResetKey}
                  hidden={hidden}
                  addButtonVariant={addButtonVariant}
                  disableExpand={disableExpand}
                  quantity={quantities ? (quantities[product.id] ?? 0) : undefined}
                  onQuantityChange={
                    onQuantityChange
                      ? (next, prev) => onQuantityChange(product.id, next, prev)
                      : undefined
                  }
                  onExpand={
                    product.expandable && !disableExpand
                      ? (origin) => onExpand(product, origin)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="product-row">
          {row2Products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addButtonVariant={addButtonVariant}
              disableExpand={disableExpand}
              quantity={quantities ? (quantities[product.id] ?? 0) : undefined}
              onQuantityChange={
                onQuantityChange
                  ? (next, prev) => onQuantityChange(product.id, next, prev)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
