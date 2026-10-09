import type {
  ConnectSessionInputType,
  ConnectSessionResultType,
  CreateChatInputType,
  CreateChatResultType,
  SendMessageInputType,
  TelegramMessageType,
} from '../model/TelegramChat.types';

/** Commands for the messenger UI. */
export type UseTelegramChatActionsResultType = {
  /** Starts a session when the instance is `authorized`. A disallowed API host is rejected. A repeat resolves as `aborted`. */
  connect: (input: ConnectSessionInputType) => Promise<ConnectSessionResultType>;
  /** Clears the local session. Does not log out of GREEN-API. */
  disconnect: () => void;
  /** Opens a personal chat by phone. A known local number skips the request. */
  createChat: (input: CreateChatInputType) => Promise<CreateChatResultType>;
  /** Cancels the phone check. */
  cancelCreateChat: () => void;
  /** Selects a listed chat. An unknown id is ignored. */
  selectChat: (chatId: string | null) => string | null;
  /** Loads the journal of a listed chat. A failed load can be retried. */
  loadChatHistory: (chatId: string) => Promise<void>;
  /** Sends text to the given chat. Rejects when the text or session is invalid. */
  sendMessage: (input: SendMessageInputType) => Promise<TelegramMessageType>;
  /** Resends one failed outgoing message. A pending send is left as is. */
  retrySend: (localId: string) => Promise<TelegramMessageType>;
};
