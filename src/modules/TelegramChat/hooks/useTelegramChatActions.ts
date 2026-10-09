import { useAction } from '@reatom/npm-react';

import { telegramChatActions } from '../model/TelegramChat.actions';

import type { UseTelegramChatActionsResultType } from './useTelegramChatActions.types';

/** Commands for connection, chats, and sending. */
export function useTelegramChatActions(): UseTelegramChatActionsResultType {
  const connect = useAction(telegramChatActions.connectAction);
  const disconnect = useAction(telegramChatActions.disconnectAction);
  const createChat = useAction(telegramChatActions.createChatAction);
  const cancelCreateChat = useAction(telegramChatActions.cancelCreateChatAction);
  const selectChat = useAction(telegramChatActions.selectChatAction);
  const loadChatHistory = useAction(telegramChatActions.loadChatHistoryAction);
  const sendMessage = useAction(telegramChatActions.sendMessageAction);
  const retrySend = useAction(telegramChatActions.retrySendAction);

  return {
    connect,
    disconnect,
    createChat,
    cancelCreateChat,
    selectChat,
    loadChatHistory,
    sendMessage,
    retrySend,
  };
}
