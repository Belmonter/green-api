import type { TelegramPersonalChatType } from '../model/TelegramChat.types';

/** Chat list and the open chat. */
export type UseTelegramChatsResultType = {
  /** Insertion order. */
  chats: readonly TelegramPersonalChatType[];
  /** Null when none is open. */
  selectedChatId: string | null;
  /** Null when the selection is missing. */
  selectedChat: TelegramPersonalChatType | null;
  /** `checkAccount` is in flight. */
  isCheckingAccount: boolean;
};
