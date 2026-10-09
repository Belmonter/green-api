import type { ChangeEvent } from 'react';

import { formatPhoneNumber } from '@shared/lib';

import { caretAfterDigits, countDigits } from './PhoneInput.utils';

import type { PhoneInputProps } from './PhoneInput.types';

/** Phone input that formats the value as the user types. */
export const PhoneInput = ({ onChange, ref, ...props }: PhoneInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = countDigits(input.value.slice(0, caret));
    const formatted = formatPhoneNumber(input.value);
    const nextCaret = caretAfterDigits(formatted, digitsBeforeCaret);

    input.value = formatted;
    input.setSelectionRange(nextCaret, nextCaret);

    onChange?.(event);
  };

  return <input {...props} ref={ref} type="tel" inputMode="tel" onChange={handleChange} />;
};
