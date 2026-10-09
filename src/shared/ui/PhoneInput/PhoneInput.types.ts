import type { ComponentPropsWithRef } from 'react';

/** Phone field. `type` and `inputMode` are fixed. */
export type PhoneInputProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'inputMode'>;
