import { useAtom } from '@reatom/npm-react';

import { telegramChatSaga } from '../model/TelegramChat.saga';
import { telegramChatStore } from '../model/TelegramChat.store';

import type { UseTelegramChatsResultType } from './useTelegramChats.types';

/** Chat list and the open chat. */
export function useTelegramChats(): UseTelegramChatsResultType {
  const [chats] = useAtom(telegramChatStore.chats);
  const [selectedChatId] = useAtom(telegramChatStore.selectedChatId);
  const [selectedChat] = useAtom(telegramChatStore.selectedChat);
  const [pendingChecks] = useAtom(telegramChatSaga.checkAccount.pendingAtom);

  return { chats, selectedChatId, selectedChat, isCheckingAccount: pendingChecks > 0 };
}
