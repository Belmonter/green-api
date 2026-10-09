import type { InstanceState, TelegramApiCredentials } from '../api/TelegramChat.api.types';
import type { Atom, AtomMut } from '@reatom/framework';

/** Failure category of a GREEN-API call. */
export type RequestFailureReasonType =
  'network' | 'timeout' | 'invalid-credentials' | 'rate-limit' | 'invalid-response' | 'unavailable' | 'rejected';

/** Instance state that does not open a session. */
export type UnavailableInstanceStateType = Exclude<InstanceState, 'authorized'>;

/** Message direction. */
export type MessageDirectionType = 'incoming' | 'outgoing';

/** Local send status. `accepted` means the API queued the text. */
export type MessageStatusType = 'pending' | 'accepted' | 'failed';

/** Why text was rejected before `sendMessage`. */
export type OutgoingTextIssueType = 'empty' | 'too-long';

/** Journal load of one chat. `idle` means it was not requested or the request was cancelled. */
export type ChatHistoryStatusType = 'idle' | 'loading' | 'loaded' | 'failed';

/** Journal status by chat id. A missing key is `idle`. */
export type ChatHistoryStatusesType = Record<string, ChatHistoryStatusType>;

/** Notification loop phase. */
export type ReceivingStatusType = 'idle' | 'running' | 'retrying' | 'failed';

/** Personal chat of the current session. */
export type TelegramPersonalChatType = {
  /** Digits only. */
  chatId: string;
  /** Digits without a plus. Null when Telegram hid the number. */
  phoneNumber: string | null;
  /** List label. Empty when there is no name. */
  displayName: string;
};

/** Labels for a personal chat. */
export type PersonalChatTitleType = {
  /** List and header label. */
  title: string;
  /** Number under the name. Null when it is already the title. */
  phone: string | null;
  /** Accessible name. */
  accessibleName: string;
};

/** Stored text message. Ids stay strings so large values are not rounded. */
export type TelegramMessageType = {
  /** Stable while the request is in flight. */
  localId: string;
  /** Server id. Null until the API returns one. */
  idMessage: string | null;
  /** Chat this message belongs to. */
  chatId: string;
  /** Message body. */
  text: string;
  /** Incoming or outgoing. */
  direction: MessageDirectionType;
  /** Unix time in milliseconds. */
  sentAt: number;
  /** Local send status. */
  status: MessageStatusType;
  /** Set only when `status` is `failed`. */
  sendFailure: RequestFailureReasonType | null;
};

/** Text the server already stored. */
export type ServerMessageType = {
  /** Digits only. */
  chatId: string;
  /** Server id. */
  idMessage: string;
  /** Message body. */
  text: string;
  /** Incoming or outgoing. */
  direction: MessageDirectionType;
  /** Unix time in milliseconds. */
  sentAt: number;
};

/** Messages by chat id, oldest first. */
export type TelegramConversationsType = Record<string, TelegramMessageType[]>;

/** Notification loop state. */
export type TelegramReceivingType = {
  /** Current phase. */
  status: ReceivingStatusType;
  /** Null while idle or running. */
  reason: RequestFailureReasonType | null;
};

/** Atoms of the Telegram chat module. */
export type TelegramChatStoreType = {
  /** Active credentials. Null when disconnected. */
  credentials: AtomMut<TelegramApiCredentials | null>;
  /** Aborts requests of the active session. Null when disconnected. */
  sessionController: AtomMut<AbortController | null>;
  /** Personal chats in insertion order. */
  chats: AtomMut<TelegramPersonalChatType[]>;
  /** Open chat id. */
  selectedChatId: AtomMut<string | null>;
  /** Messages by chat id. */
  conversations: AtomMut<TelegramConversationsType>;
  /** Notification loop of the active session. */
  receiving: AtomMut<TelegramReceivingType>;
  /** Journal status of each chat. */
  chatHistory: AtomMut<ChatHistoryStatusesType>;
  /** Open chat. */
  selectedChat: Atom<TelegramPersonalChatType | null>;
  /** Messages of the open chat. */
  selectedMessages: Atom<readonly TelegramMessageType[]>;
  /** Journal status of the open chat. */
  selectedHistoryStatus: Atom<ChatHistoryStatusType>;
};

/** Credentials from the connection form. Stored only after `authorized`. */
export type ConnectSessionInputType = {
  /** API host. */
  apiUrl: string;
  /** Numeric instance id. */
  idInstance: string;
  /** Instance token. Kept in memory only. */
  apiTokenInstance: string;
};

/** Instance is authorized and the session has started. */
export type ConnectSessionConnectedResultType = {
  /** Session started. */
  outcome: 'connected';
};

/** Instance state that does not open a chat. Credentials are not stored. */
export type ConnectSessionUnavailableResultType = {
  /** Session stayed disconnected. */
  outcome: 'unavailable';
  /** State from `getStateInstance`. */
  instanceState: UnavailableInstanceStateType;
};

/** Check was cancelled or a repeat was ignored. */
export type ConnectSessionAbortedResultType = {
  /** No session was started. */
  outcome: 'aborted';
};

/** Connection check result. Transport failures reject the promise. */
export type ConnectSessionResultType =
  ConnectSessionConnectedResultType | ConnectSessionUnavailableResultType | ConnectSessionAbortedResultType;

/** Why `checkAccount` refused the number on HTTP 200. */
export type CreateChatAccountRefusalReasonType = 'rate-limit' | 'rejected';

/** Phone number from the new-chat form. Separators may still be present. */
export type CreateChatInputType = {
  /** International number as typed. */
  phoneNumber: string;
};

/** Chat opened from the phone check. */
export type CreateChatOpenedResultType = {
  /** Chat is selected. */
  outcome: 'opened';
  /** True when the chat was already in the list. */
  existed: boolean;
  /** Open chat. */
  chat: TelegramPersonalChatType;
};

/** Account was not found. No chat is stored. */
export type CreateChatMissingResultType = {
  /** No chat was stored. */
  outcome: 'missing';
};

/** Account check was refused. No chat is stored. */
export type CreateChatRefusedResultType = {
  /** Check was refused. */
  outcome: 'refused';
  /** Refusal category. */
  reason: CreateChatAccountRefusalReasonType;
};

/** Check was cancelled or a repeat was ignored. */
export type CreateChatAbortedResultType = {
  /** No chat was created. */
  outcome: 'aborted';
};

/** No session, so the number was not checked. */
export type CreateChatNotConnectedResultType = {
  /** `checkAccount` was not called. */
  outcome: 'not-connected';
};

/** Result of opening a chat by phone. Transport failures reject the promise. */
export type CreateChatResultType =
  | CreateChatOpenedResultType
  | CreateChatMissingResultType
  | CreateChatRefusedResultType
  | CreateChatAbortedResultType
  | CreateChatNotConnectedResultType;

/** Text submitted from the composer. `chatId` is the open chat at submit time. */
export type SendMessageInputType = {
  /** Destination chat. */
  chatId: string;
  /** Text as typed, including surrounding spaces. */
  text: string;
};
