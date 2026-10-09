/** Counts digits. Other characters are ignored. */
export const countDigits = (value: string): number => value.replace(/\D/g, '').length;

/** Index after `count` digits. The string length when there are fewer. */
export const caretAfterDigits = (formatted: string, count: number): number => {
  if (count <= 0) {
    return 0;
  }

  let seen = 0;

  for (let index = 0; index < formatted.length; index += 1) {
    const char = formatted[index];

    if (char && char >= '0' && char <= '9') {
      seen += 1;

      if (seen === count) {
        return index + 1;
      }
    }
  }

  return formatted.length;
};
