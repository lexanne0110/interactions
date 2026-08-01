import { useCallback, useEffect, useState } from 'react';
import {
  findInteraction,
  getDefaultInteraction,
  interactionHashPath,
  parseHashRoute,
  type InteractionDefinition,
} from '../interactions/registry';

export function useHashRoute() {
  const [interaction, setInteraction] = useState<InteractionDefinition>(() => {
    const parsed = parseHashRoute(window.location.hash);
    if (parsed) {
      const found = findInteraction(parsed.categoryId, parsed.interactionId);
      if (found) return found;
    }
    return getDefaultInteraction();
  });

  const selectInteraction = useCallback((next: InteractionDefinition) => {
    const path = interactionHashPath(next);
    if (window.location.hash !== path) {
      window.location.hash = path.slice(1);
    }
    setInteraction(next);
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const parsed = parseHashRoute(window.location.hash);
      if (parsed) {
        const found = findInteraction(parsed.categoryId, parsed.interactionId);
        if (found) {
          setInteraction(found);
          return;
        }
      }

      const fallback = getDefaultInteraction();
      setInteraction(fallback);
      window.location.hash = interactionHashPath(fallback).slice(1);
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  return { interaction, selectInteraction };
}
