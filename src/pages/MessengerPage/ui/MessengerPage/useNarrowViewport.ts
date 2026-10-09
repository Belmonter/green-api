import { useSyncExternalStore } from 'react';

/** Matches the page stylesheet breakpoint. */
const NARROW_MESSENGER_QUERY = '(max-width: 759px)';

const subscribe = (onStoreChange: () => void): (() => void) => {
  const media = window.matchMedia(NARROW_MESSENGER_QUERY);

  media.addEventListener('change', onStoreChange);

  return () => {
    media.removeEventListener('change', onStoreChange);
  };
};

const getSnapshot = (): boolean => window.matchMedia(NARROW_MESSENGER_QUERY).matches;

const getServerSnapshot = (): boolean => false;

/** True on a single-column layout. */
export const useNarrowViewport = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
