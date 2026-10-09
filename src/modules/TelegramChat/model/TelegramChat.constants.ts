import type { TelegramReceivingType } from './TelegramChat.types';

/** Receiving state while the loop is not polling. */
export const INITIAL_RECEIVING_STATE: TelegramReceivingType = {
  status: 'idle',
  reason: null,
};

/** First retry wait, in milliseconds. */
export const RECEIVING_RETRY_BASE_DELAY_MS = 1_000;

/** Max retry wait, in milliseconds. */
export const RECEIVING_RETRY_MAX_DELAY_MS = 30_000;
