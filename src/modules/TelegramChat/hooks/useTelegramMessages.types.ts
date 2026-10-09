import type { ChatHistoryStatusType, TelegramMessageType } from '../model/TelegramChat.types';

/** Open chat messages. */
export type UseTelegramMessagesResultType = {
  /** Oldest first. Empty when no chat is open. */
  messages: readonly TelegramMessageType[];
  /** `idle` when no chat is open. */
  historyStatus: ChatHistoryStatusType;
};
