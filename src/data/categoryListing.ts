import { assetUrl } from '../lib/assetUrl';
export type CategoryProductLayout =
  | 'apple-3238'
  | 'banana-3254'
  | 'greens-3235'
  | 'atta-151'
  | 'pack-2856-full'
  | 'pack-2856-crop';

export type CategoryListingProduct = {
  id: string;
  title: string;
  size: string;
  price: string;
  mrp: string;
  eta: string;
  cardBg: 'tan' | 'cream';
  layout: CategoryProductLayout;
  animatedOffers?: boolean;
  memberPrice?: number;
  staticOffer?: string;
};

export type CategorySidebarItem = {
  id: string;
  label: string;
  icon: string;
  badge?: string;
};

export const DEFAULT_SIDEBAR_SELECTION = 'oil';

export const categorySidebarItems: CategorySidebarItem[] = [
  {
    id: 'oil',
    label: 'Oil & Ghee',
    icon: assetUrl('/assets/category-listing/sidebar/icons/oil.png'),
  },
  {
    id: 'atta',
    label: 'Atta & Flour',
    icon: assetUrl('/assets/category-listing/sidebar/icons/atta.png'),
    badge: '40% OFF',
  },
  {
    id: 'spices',
    label: 'Spices, Ma...',
    icon: assetUrl('/assets/category-listing/sidebar/icons/spices.png'),
  },
  {
    id: 'sugar',
    label: 'Sugar',
    icon: assetUrl('/assets/category-listing/sidebar/icons/sugar.png'),
  },
  {
    id: 'rice',
    label: 'Rice & Ric..',
    icon: assetUrl('/assets/category-listing/sidebar/icons/rice.png'),
  },
  {
    id: 'salts',
    label: 'Salts',
    icon: assetUrl('/assets/category-listing/sidebar/icons/salts.png'),
  },
];

/** First screen — matches Figma CL_Offers Interaction_1 */
export const categoryListingProducts: CategoryListingProduct[] = [
  {
    id: 'cl-1',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    cardBg: 'tan',
    layout: 'apple-3238',
    animatedOffers: true,
  },
  {
    id: 'cl-2',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    cardBg: 'tan',
    layout: 'banana-3254',
  },
  {
    id: 'cl-3',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    cardBg: 'tan',
    layout: 'greens-3235',
    memberPrice: 55,
  },
  {
    id: 'cl-4',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    cardBg: 'cream',
    layout: 'atta-151',
  },
  {
    id: 'cl-5',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    cardBg: 'tan',
    layout: 'pack-2856-full',
    staticOffer: '19% OFF',
  },
  {
    id: 'cl-6',
    title: 'Aashirvaad Atta with Multigrains',
    size: '500 g',
    price: '₹61',
    mrp: '₹85',
    eta: '60 mins',
    cardBg: 'tan',
    layout: 'pack-2856-crop',
    staticOffer: '19% OFF',
  },
];

export const LAYOUT_IMAGES: Record<CategoryProductLayout, string> = {
  'apple-3238': assetUrl('/assets/category-listing/product-3238.png'),
  'banana-3254': assetUrl('/assets/category-listing/product-3254.png'),
  'greens-3235': assetUrl('/assets/category-listing/product-3235.png'),
  'atta-151': assetUrl('/assets/category-listing/product-151.png'),
  'pack-2856-full': assetUrl('/assets/category-listing/product-2856-full.png'),
  'pack-2856-crop': assetUrl('/assets/category-listing/product-2856-crop.png'),
};
