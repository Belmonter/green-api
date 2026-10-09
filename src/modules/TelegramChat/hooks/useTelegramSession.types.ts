import type { TelegramReceivingType } from '../model/TelegramChat.types';

/** Connection and notification loop. The token is not included. */
export type UseTelegramSessionResultType = {
  /** Session can open chats and send messages. */
  isConnected: boolean;
  /** `getStateInstance` is in flight. */
  isConnecting: boolean;
  /** Null when disconnected. */
  idInstance: string | null;
  /** API origin. Null when disconnected. */
  apiUrl: string | null;
  /** Notification loop state. */
  receiving: TelegramReceivingType;
};
