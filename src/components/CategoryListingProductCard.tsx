import type { CategoryListingProduct } from '../data/categoryListing';
import { LAYOUT_IMAGES } from '../data/categoryListing';
import { MemberPriceLabel } from './MemberPriceLabel';
import { OfferBadgeRotator } from './OfferBadgeRotator';

type Props = {
  product: CategoryListingProduct;
  showOffers?: boolean;
};

export function CategoryListingProductCard({ product, showOffers = true }: Props) {
  const layout = product.layout;
  const needsPhotoWrap = layout === 'atta-151' || layout.startsWith('pack-2856');

  return (
    <article className="cl-card">
      <div
        className={[
          'cl-card-media',
          product.cardBg === 'cream' ? 'cl-card-media--cream' : 'cl-card-media--tan',
        ].join(' ')}
      >
        {needsPhotoWrap ? (
          <div className={`cl-card-photo-wrap cl-card-photo-wrap--${layout}`}>
            <img
              className={`cl-card-photo cl-card-photo--${layout}`}
              src={LAYOUT_IMAGES[layout]}
              alt={product.title}
            />
          </div>
        ) : (
          <img
            className={`cl-card-photo cl-card-photo--${layout}`}
            src={LAYOUT_IMAGES[layout]}
            alt={product.title}
          />
        )}
        <div className={`cl-card-size cl-card-size--${layout}`}>
          <span>{product.size}</span>
        </div>
      </div>

      <div className="cl-card-body">
        <div className="cl-card-info">
          <div className="price-row">
            <span className="price">{product.price}</span>
            <span className="mrp">{product.mrp}</span>
          </div>
          <h3 className="title">{product.title}</h3>
          {showOffers ? <OfferSlot product={product} /> : null}
          <p className="eta">{product.eta}</p>
        </div>
        <button type="button" className="cl-add-btn">
          ADD
        </button>
      </div>
    </article>
  );
}

function OfferSlot({ product }: { product: CategoryListingProduct }) {
  if (product.animatedOffers) {
    return <OfferBadgeRotator />;
  }

  if (product.memberPrice != null) {
    return <MemberPriceLabel price={product.memberPrice} />;
  }

  if (product.staticOffer) {
    return (
      <div className="offer-badge-slot">
        <span className="offer-green-text">{product.staticOffer}</span>
      </div>
    );
  }

  return <div className="offer-badge-slot" aria-hidden />;
}
