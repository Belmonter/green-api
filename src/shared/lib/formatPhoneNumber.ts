import { AsYouType } from 'libphonenumber-js';

/** Max international number length, in digits. */
const MAX_DIGITS = 15;

/** International format. A country code is not guessed. */
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, MAX_DIGITS);

  return digits ? new AsYouType().input(`+${digits}`) : '';
};
