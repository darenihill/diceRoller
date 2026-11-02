/**
 * Buzz when dice land: a short phone buzz on landing, even with sound off.
 * Trial (owner, 2026-10-28): the switch stays hidden and off for everyone
 * until the private link below turns it on for one phone.
 */
export const BUZZ_KEY = 'buzzOnLand';
export const BUZZ_SHOWN_KEY = 'buzzSwitchShown';
/** Opening the app with this link turns the buzz on and shows its switch in Customize */
export const BUZZ_LINK_HASH = '#try-buzz';

/** Android browsers can buzz; iPhone browsers can't */
export const canBuzz = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export const buzzLanding = () => {
  try {
    if (canBuzz()) navigator.vibrate([15, 30, 15]);
  } catch {
    // A browser that refuses just stays quiet
  }
};

export const isBuzzLink = (hash: string): boolean => hash === BUZZ_LINK_HASH;
