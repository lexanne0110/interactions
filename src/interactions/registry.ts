import type { ComponentType } from 'react';
import { CategoryListingOfferInteraction } from './category-listing/CategoryListingOfferInteraction';
import { CategoryListingL2TransitionInteraction } from './category-listing/CategoryListingL2TransitionInteraction';
import { AddButtonInteraction } from './add-button/AddButtonInteraction';
import { MiniCartInteraction } from './mini-cart/MiniCartInteraction';
import { CardExpandInteraction } from './search-to-pdp/CardExpandInteraction';
import { SearchTypeaheadInteraction } from './search-typeahead/SearchTypeaheadInteraction';
import { CartScreenInteraction } from './cart/CartScreenInteraction';
import { BillExpandInteraction } from './cart/BillExpandInteraction';
import { BillChargesInteraction } from './cart/BillChargesInteraction';
import { BillLiquorInteraction } from './cart/BillLiquorInteraction';
import { QuantityToRemoveInteraction } from './cart/QuantityToRemoveInteraction';
import { CouponApplyInteraction } from './cart/CouponApplyInteraction';
import { IncognitoToggleInteraction } from './cart/IncognitoToggleInteraction';
import { WalletApplyInteraction } from './cart/WalletApplyInteraction';

export type InteractionDefinition = {
  id: string;
  categoryId: string;
  categoryLabel: string;
  title: string;
  description: string;
  Component: ComponentType;
  /** Controls rendered beside the phone, outside its frame — for conditions a shopper can't set in-app. */
  Aside?: ComponentType;
  /** Nests this entry under another in the side nav, as a sub-interaction. */
  parentId?: string;
  /**
   * Kept out of the side nav but still routable by hash — for work that is
   * parked rather than deleted. Unhide by removing the flag.
   */
  hidden?: boolean;
};

export type InteractionCategory = {
  id: string;
  label: string;
  interactions: InteractionDefinition[];
};

const cardExpand: InteractionDefinition = {
  id: 'card-expand',
  categoryId: 'search-to-pdp',
  categoryLabel: 'Search to PDP transitions',
  title: 'Card expand → Popup → PDP',
  description: 'Tap Spinach, Aashirvaad Atta, or Apple → popup morph → scroll to PDP.',
  Component: CardExpandInteraction,
};

const searchTypeahead: InteractionDefinition = {
  id: 'search-typeahead',
  categoryId: 'search',
  categoryLabel: 'Search interactions',
  title: 'Search typeahead',
  description: 'Type atta → beige panel expands, suggestions stagger in.',
  Component: SearchTypeaheadInteraction,
};

const categoryListingOffer: InteractionDefinition = {
  id: 'category-listing-offer',
  categoryId: 'category-listing',
  categoryLabel: 'Category listing',
  title: 'Category listing offers',
  description:
    'First product cycles green offer messages in place. Third product shows a persistent gold member price with a periodic shimmer sweep.',
  Component: CategoryListingOfferInteraction,
};

const quantityStepper: InteractionDefinition = {
  id: 'quantity-stepper',
  categoryId: 'add-button',
  categoryLabel: 'Add button interactions',
  title: 'ADD → quantity stepper',
  description: 'Tap ADD → − 1 + counter with slide animations; max 5 shows MAX.',
  Component: AddButtonInteraction,
};

const categoryListingL2: InteractionDefinition = {
  id: 'category-listing-l2',
  categoryId: 'category-listing',
  categoryLabel: 'Category listing',
  title: 'L2 Transition',
  description:
    'Tap sidebar categories to switch the selected state. Oil & Ghee starts selected.',
  Component: CategoryListingL2TransitionInteraction,
};

const miniCart: InteractionDefinition = {
  id: 'mini-cart',
  categoryId: 'mini-cart',
  categoryLabel: 'Mini cart',
  title: 'Mini cart',
  description:
    'Add Spinach, Atta, or Apple → first add opens the mini cart from the center as the item drops in; later items drop from above. Badge counts unique items; max three stacked circles.',
  Component: MiniCartInteraction,
};

const cartScreen: InteractionDefinition = {
  id: 'cart-screen',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  title: 'Cart screen',
  description:
    'The full cart, built to Figma, carrying every finished interaction. Expand the bill, tap a dotted fee, step an item to zero.',
  Component: CartScreenInteraction,
};

const billExpand: InteractionDefinition = {
  id: 'bill-expand',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  title: 'Bill expand',
  description:
    'Tap anywhere on the bill card → lines stagger in and the card grows in place. Tap a dotted fee for its tooltip.',
  Component: BillExpandInteraction,
};

const billCharges: InteractionDefinition = {
  id: 'bill-charges',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  parentId: 'bill-expand',
  // Parked 2026-09-16 at the designer's request; may come back.
  hidden: true,
  title: 'Bill charges',
  description:
    'Step items across the thresholds → delivery (above ₹199) and the small cart fee (above ₹99) apply and waive in place: the row washes, the original strikes through and the amount rolls.',
  Component: BillChargesInteraction,
};

const billLiquor: InteractionDefinition = {
  id: 'bill-liquor',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  parentId: 'bill-expand',
  // Parked 2026-09-16 at the designer's request; may come back.
  hidden: true,
  title: 'Liquor charge',
  description:
    'Liquor in the cart adds a ₹69 handling charge, waived in happy hour above ₹999 of liquor. Step Johnnie Walker to 7 to waive it, or to 0 to remove the line.',
  Component: BillLiquorInteraction,
};

const quantityToRemove: InteractionDefinition = {
  id: 'quantity-to-remove',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  title: 'Stepper to zero → empty cart',
  description:
    'Step an item down past 1 → the row collapses and the rest close the gap. Empty the cart and the sections collapse top-down into the empty state.',
  Component: QuantityToRemoveInteraction,
};

const couponApply: InteractionDefinition = {
  id: 'coupon-apply',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  title: 'Coupon apply',
  description:
    'Press APPLY → the check springs in with a confetti burst, the header turns green and a "You have saved" strip slides out from under it, and Pay re-counts. REMOVE is a plain press back to the start. Drag the rail for the second coupon.',
  Component: CouponApplyInteraction,
};

const incognitoToggle: InteractionDefinition = {
  id: 'incognito-toggle',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  title: 'Incognito toggle',
  description:
    'Tap the header switch → the Incognito Mode On sheet rises. Tap the sheet and it drops away as the chrome retints and the header slides down to uncover the strip; tap ✕ and nothing changes. Turning it off needs no confirmation.',
  Component: IncognitoToggleInteraction,
};

const walletApply: InteractionDefinition = {
  id: 'wallet-apply',
  categoryId: 'cart',
  categoryLabel: 'Cart',
  title: 'Wallet apply',
  description:
    'Tick Jiffy Wallet \u2192 \u20B920 of the \u20B9100 balance comes off as its own bill line and Pay counts down. "You saved" holds still \u2014 wallet balance is your own money, not a discount.',
  Component: WalletApplyInteraction,
};

export const categories: InteractionCategory[] = [
  {
    id: 'cart',
    label: 'Cart',
    interactions: [
      cartScreen, billExpand, billCharges, billLiquor,
      quantityToRemove, couponApply, walletApply, incognitoToggle,
    ],
  },
  {
    id: 'search-to-pdp',
    label: 'Search to PDP transitions',
    interactions: [cardExpand],
  },
  {
    id: 'search',
    label: 'Search interactions',
    interactions: [searchTypeahead],
  },
  {
    id: 'add-button',
    label: 'Add button interactions',
    interactions: [quantityStepper],
  },
  {
    id: 'mini-cart',
    label: 'Mini cart',
    interactions: [miniCart],
  },
  {
    id: 'category-listing',
    label: 'Category listing',
    interactions: [categoryListingOffer, categoryListingL2],
  },
];

export const allInteractions = categories.flatMap((c) => c.interactions);

export function getDefaultInteraction(): InteractionDefinition {
  return allInteractions[0];
}

export function findInteraction(
  categoryId: string,
  interactionId: string,
): InteractionDefinition | undefined {
  const category = categories.find((c) => c.id === categoryId);
  return category?.interactions.find((i) => i.id === interactionId);
}

export function interactionHashPath(interaction: InteractionDefinition): string {
  return `#/${interaction.categoryId}/${interaction.id}`;
}

export function parseHashRoute(
  hash: string,
): { categoryId: string; interactionId: string } | null {
  const path = hash.replace(/^#\/?/, '');
  if (!path) return null;

  const [categoryId, interactionId] = path.split('/');
  if (!categoryId || !interactionId) return null;

  return { categoryId, interactionId };
}
