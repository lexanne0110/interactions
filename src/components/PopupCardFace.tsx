import { assetUrl } from '../lib/assetUrl';
import type { Product } from '../data/products';
import { expandableCarouselProducts } from '../data/products';
import { PreviouslyBoughtBadge } from './PreviouslyBoughtBadge';

type Props = {
  product: Product;
  /** Carousel position this card occupies, for its own dot indicator. */
  index: number;
};

/**
 * Static popup-state card face (scroll progress = 0) — hero, info card, cart bar.
 *
 * Used for the carousel neighbour peeks so the card sliding in during a swipe is already
 * complete and correctly sized. Because the geometry makes the incoming peek land exactly
 * where the active sheet arrives (same left, same width), the product swap at snap end is
 * visually invisible — but only while this stays a faithful copy of the popup-state markup.
 *
 * COUPLING: this deliberately reuses the active sheet's own classes (`.popup-hero-bg`,
 * `.popup-info-card`, `.cart-bar`, …) rather than peek-specific ones, so the two render
 * identically. The active sheet in ProductPopup keeps its own copy of this markup because
 * that copy is threaded with scroll `visualProgress` at many nodes; if you change the
 * popup-state markup there, mirror it here or the swap will start to show a seam.
 */
export function PopupCardFace({ product, index }: Props) {
  const heroImage = product.popupHeroImage ?? product.images[0]?.src ?? '';

  return (
    <div className="popup-card-face">
      <div className="popup-card-face-body">
        <div className="popup-expand-shell">
          <section className="popup-hero-section">
            <div className="popup-hero-bg">
              <div
                className={`popup-hero-img-slot${product.popupHeroSlotClass ? ` ${product.popupHeroSlotClass}` : ''}`}
              >
                <img
                  className={`popup-hero-img${product.popupHeroClass ? ` ${product.popupHeroClass}` : ''}`}
                  src={heroImage}
                  alt=""
                />
              </div>
            </div>

            <div className="carousel-dots">
              {expandableCarouselProducts.map((item, dotIndex) => (
                <span
                  key={item.id}
                  className={`dot${dotIndex === index ? ' active' : ''}`}
                />
              ))}
            </div>
          </section>

          <div className="popup-info-card">
            <div className="popup-info-content">
              {product.previouslyBought && (
                <div className="badge-popup-wrap">
                  <PreviouslyBoughtBadge variant="popup" />
                </div>
              )}

              <div className="popup-info-body">
                <h2 className="popup-title">{product.title}</h2>
                <p className="popup-size">{product.size}</p>
                <div className="popup-price-row">
                  <span className="popup-price">{product.price}</span>
                  <span className="popup-mrp">{product.mrp}</span>
                </div>
                <p className="popup-eta">{product.eta}</p>
              </div>

              <div className="view-details">
                <span>View Product Details</span>
                <img src={assetUrl('/assets/icons/chevron-down.svg')} alt="" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cart-bar">
        <div className="cart-price-block">
          <div className="cart-price-row">
            <span className="cart-price">{product.price}</span>
            <span className="cart-mrp">MRP {product.mrp}</span>
          </div>
          <span className="cart-tax">Inclusive of all taxes</span>
        </div>
        <div className="cart-btn">ADD TO CART</div>
      </div>
    </div>
  );
}
