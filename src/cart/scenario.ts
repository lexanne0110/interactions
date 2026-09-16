import { useSyncExternalStore } from 'react';

/**
 * Conditions a shopper cannot set from inside the cart — membership, a store's
 * happy hour — plus whether liquor is in it.
 *
 * The prototype's side panel lives outside the phone frame, so it cannot share
 * React state with the screen through props. A tiny external store lets the
 * panel and the phone read and write the same values without either owning
 * the other.
 */
export type CartScenario = {
  /** My Spencers Rewards member: free delivery starts at ₹149 instead of ₹199. */
  msr: boolean;
  /** Store happy hour: liquor handling is waived above ₹999 of liquor. */
  happyHour: boolean;
  /** Whether the liquor item is in the cart. Two-way: steppers can remove it too. */
  liquor: boolean;
};

export function createScenarioStore(initial: CartScenario) {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  return {
    get: () => state,
    set: (patch: Partial<CartScenario>) => {
      const next = { ...state, ...patch };
      if (next.msr === state.msr && next.happyHour === state.happyHour && next.liquor === state.liquor) return;
      state = next;
      emit();
    },
    /** Each visit to the prototype starts from the same scenario. */
    reset: () => {
      state = initial;
      emit();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type ScenarioStore = ReturnType<typeof createScenarioStore>;

export function useScenario(store: ScenarioStore): CartScenario {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** bill-charges: not a member and no liquor, so delivery waives at ₹199. */
export const chargesScenario = createScenarioStore({ msr: false, happyHour: false, liquor: false });

/** bill-liquor: liquor in the cart and happy hour already on, so one step shows the waiver. */
export const liquorScenario = createScenarioStore({ msr: false, happyHour: true, liquor: true });
