import type { ComponentType } from 'react';
import { CategoryListingOfferInteraction } from './category-listing/CategoryListingOfferInteraction';
import { CategoryListingL2TransitionInteraction } from './category-listing/CategoryListingL2TransitionInteraction';
import { AddButtonInteraction } from './add-button/AddButtonInteraction';
import { MiniCartInteraction } from './mini-cart/MiniCartInteraction';
import { CardExpandInteraction } from './search-to-pdp/CardExpandInteraction';
import { SearchTypeaheadInteraction } from './search-typeahead/SearchTypeaheadInteraction';

export type InteractionDefinition = {
  id: string;
  categoryId: string;
  categoryLabel: string;
  title: string;
  description: string;
  Component: ComponentType;
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

export const categories: InteractionCategory[] = [
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
