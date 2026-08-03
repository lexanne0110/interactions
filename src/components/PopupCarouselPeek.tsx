import type { Product } from '../data/products';

type Props = {
  product: Product;
  side: 'left' | 'right';
};

/** Clipped edge of a neighbor popup — hints that the carousel can swipe horizontally. */
export function PopupCarouselPeek({ product, side }: Props) {
  const heroImage = product.popupHeroImage ?? product.images[0]?.src ?? '';

  return (
    <div className={`popup-carousel-peek popup-carousel-peek--${side}`} aria-hidden>
      <div className="popup-carousel-peek-sheet">
        <div
          className={`popup-carousel-peek-hero${product.heroBg === 'cream' ? ' hero-cream' : ' hero-tan'}`}
        >
          <img
            className={`popup-carousel-peek-img${product.popupHeroClass ? ` ${product.popupHeroClass}` : ''}`}
            src={heroImage}
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
