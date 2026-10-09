import { useAtom } from '@reatom/npm-react';

import { telegramChatSaga } from '../model/TelegramChat.saga';
import { telegramChatStore } from '../model/TelegramChat.store';

import type { UseTelegramSessionResultType } from './useTelegramSession.types';

/** Connection and notification loop. */
export function useTelegramSession(): UseTelegramSessionResultType {
  const [credentials] = useAtom(telegramChatStore.credentials);
  const [receiving] = useAtom(telegramChatStore.receiving);
  const [pendingChecks] = useAtom(telegramChatSaga.connectInstance.pendingAtom);

  return {
    isConnected: credentials !== null,
    isConnecting: pendingChecks > 0,
    idInstance: credentials?.idInstance ?? null,
    apiUrl: credentials?.apiUrl ?? null,
    receiving,
  };
}
