/** Notice for a notification-loop problem. */
export type ReceivingNoticeType = {
  /** Text to show. */
  text: string;
  /** `failed` stopped the loop. `retry` is still recovering. */
  tone: 'retry' | 'failed';
};
