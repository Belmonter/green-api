import type { TelegramMessageType } from '@modules/TelegramChat';

/** Scroll follower input. */
export type UseStickToBottomInputType = {
  /** Open chat. A new id starts at the latest message. */
  chatId: string | null;
  /** Open chat messages. */
  messages: readonly TelegramMessageType[];
  /** Skip scrolling while the column is hidden. */
  hidden: boolean;
};
