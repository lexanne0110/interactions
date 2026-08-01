export type HeroBg = 'tan' | 'cream';

export type ProductImage = {
  src: string;
  layer?: '3228' | '3233' | '3238' | '3254' | 'layer46' | 'hero';
};

export type ProductBrand = {
  name: string;
  subtitle: string;
  logo: string;
};

export type Product = {
  id: string;
  title: string;
  size: string;
  price: string;
  mrp: string;
  eta: string;
  heroBg: HeroBg;
  images: ProductImage[];
  previouslyBought?: boolean;
  expandable?: boolean;
  popupHeroImage?: string;
  /** Extra class on popup hero img for per-product fit */
  popupHeroClass?: string;
  /** Extra class on popup hero slot for per-product dimensions */
  popupHeroSlotClass?: string;
  brand?: ProductBrand;
};

export type Suggestion = {
  id: string;
  label: string;
  image: string;
};

export const EXPANDABLE_PRODUCT_ID = 'aashirvaad-atta';

export function cardLayoutId(productId: string) {
  return `card-expand-${productId}`;
}

/** Primary product image used in mini-cart circular thumbs. */
export function productCartThumb(product: Product): string {
  if (product.popupHeroImage) return product.popupHeroImage;
  const last = product.images[product.images.length - 1];
  return last?.src ?? product.images[0]?.src ?? '';
}

export const searchSuggestions: Suggestion[] = [
  { id: 's1', label: 'Aashirvaad Atta', image: '/assets/suggestions/suggestion-1.png' },
  { id: 's2', label: 'Wheat Atta', image: '/assets/suggestions/suggestion-2.png' },
  { id: 's3', label: 'Multigrain Atta', image: '/assets/suggestions/suggestion-3.png' },
  { id: 's4', label: 'Khapli Wheat Atta', image: '/assets/suggestions/suggestion-4.png' },
  { id: 's5', label: 'Chakki Atta', image: '/assets/suggestions/suggestion-5.png' },
];

export const recentSearches: Suggestion[] = [
  { id: 'r1', label: 'Aashirvaad Atta', image: '/assets/suggestions/suggestion-1.png' },
  { id: 'r2', label: 'Potato', image: '/assets/products/suggest-2.png' },
  { id: 'r3', label: 'Ice', image: '/assets/products/suggest-3.png' },
  { id: 'r4', label: 'Noodles', image: '/assets/products/suggest-4.png' },
  { id: 'r5', label: 'Sheba Cat Food', image: '/assets/products/suggest-5.png' },
];

export const ATTA_QUERY = 'atta';

/** Row 1: spinach bundle, expandable Aashirvaad Atta, apple */
export const row1Products: Product[] = [
  {
    id: 'multigrains-greens',
    title: 'Spinach',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'tan',
    images: [
      { src: '/assets/products/multigrains-3228.png', layer: '3228' },
      { src: '/assets/products/spinach-3233.png', layer: '3233' },
    ],
    expandable: true,
    popupHeroImage: '/assets/products/spinach-3233.png',
    popupHeroClass: 'popup-hero-spinach',
    popupHeroSlotClass: 'popup-hero-slot-fill',
    brand: {
      name: 'Fresh Greens',
      subtitle: 'Explore all vegetables',
      logo: '/assets/brands/brand-avatar-1.png',
    },
  },
  {
    id: EXPANDABLE_PRODUCT_ID,
    title: 'Aashirvaad Atta',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'cream',
    images: [{ src: '/assets/products/aashirvaad-atta-hero.png', layer: 'hero' }],
    previouslyBought: true,
    expandable: true,
    popupHeroImage: '/assets/products/popup-hero.png',
    brand: {
      name: 'Aashirvaad',
      subtitle: 'Explore all products',
      logo: '/assets/brands/aashirvaad-logo.png',
    },
  },
  {
    id: 'multigrains-tan',
    title: 'Apple',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'tan',
    images: [{ src: '/assets/products/multigrains-3238.png', layer: '3238' }],
    previouslyBought: true,
    expandable: true,
    popupHeroImage: '/assets/products/multigrains-3238.png',
    popupHeroClass: 'popup-hero-apple',
    popupHeroSlotClass: 'popup-hero-slot-fill',
    brand: {
      name: 'Fresh Fruits',
      subtitle: 'Explore all fruits',
      logo: '/assets/brands/brand-avatar-2.png',
    },
  },
];

/** Row-1 expandable products left → right (Spinach, Atta, Apple). For popup swipe carousel. */
export const expandableCarouselProducts = row1Products.filter((p) => p.expandable);

/** Neighbor in the popup swipe carousel (left = earlier in row, right = later). */
export function adjacentExpandableProduct(
  productId: string,
  direction: 'left' | 'right',
): Product | null {
  const index = expandableCarouselProducts.findIndex((p) => p.id === productId);
  if (index === -1) return null;
  const next = direction === 'left' ? index - 1 : index + 1;
  return expandableCarouselProducts[next] ?? null;
}

/** Row 2: bananas, tea, apple */
export const row2Products: Product[] = [
  {
    id: 'banana',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'tan',
    images: [
      { src: '/assets/products/multigrains-3228.png', layer: '3228' },
      { src: '/assets/products/multigrains-3254.png', layer: '3254' },
    ],
    previouslyBought: true,
  },
  {
    id: 'atta-cream',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'cream',
    images: [{ src: '/assets/products/apple-layer46.png', layer: 'layer46' }],
  },
  {
    id: 'apple',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'tan',
    images: [{ src: '/assets/products/multigrains-3238.png', layer: '3238' }],
    previouslyBought: true,
  },
];

export const products: Product[] = [...row1Products, ...row2Products];

export const recommendations: Product[] = [
  {
    id: 'rec-1',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'tan',
    images: [{ src: '/assets/products/aashirvaad-multigrains.png' }],
  },
  {
    id: 'rec-2',
    title: 'Aashirvaad Atta',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    heroBg: 'cream',
    images: [{ src: '/assets/products/aashirvaad-atta-hero.png' }],
  },
  {
    id: 'rec-3',
    title: 'Fortune Sun Lite',
    size: '500 g',
    price: '₹155',
    mrp: '₹175',
    eta: '60 mins',
    heroBg: 'tan',
    images: [{ src: '/assets/products/oil.png' }],
  },
];
