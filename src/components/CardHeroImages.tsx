import type { Product } from '../data/products';

export function CardHeroImages({
  product,
  layoutResetKey = 0,
  useExpandSlot = false,
}: {
  product: Product;
  layoutResetKey?: number;
  useExpandSlot?: boolean;
}) {
  if (useExpandSlot && product.expandable && product.images.length === 1) {
    const img = product.images[0];
    if (img.layer === 'hero') {
      return (
        <div key={`hero-expand-${layoutResetKey}`} className="hero-expand-slot">
          <img className="hero-layer hero-layer-hero" src={img.src} alt={product.title} />
        </div>
      );
    }
  }

  return product.images.map((img, index) => {
    const layerClass = img.layer ? `hero-layer hero-layer-${img.layer}` : 'card-hero-img';
    const isPrimaryHero = index === 0;

    return (
      <img
        key={`${img.src}-${index}-${layoutResetKey}`}
        className={layerClass}
        src={img.src}
        alt={isPrimaryHero ? product.title : ''}
        aria-hidden={!isPrimaryHero ? true : undefined}
      />
    );
  });
}
