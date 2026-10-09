import { useAtom } from '@reatom/npm-react';

import { telegramChatStore } from '../model/TelegramChat.store';

import type { UseTelegramMessagesResultType } from './useTelegramMessages.types';

/** Messages and journal status of the open chat. */
export function useTelegramMessages(): UseTelegramMessagesResultType {
  const [messages] = useAtom(telegramChatStore.selectedMessages);
  const [historyStatus] = useAtom(telegramChatStore.selectedHistoryStatus);

  return { messages, historyStatus };
}
