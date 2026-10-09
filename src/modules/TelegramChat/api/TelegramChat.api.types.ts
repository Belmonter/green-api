import type { INSTANCE_STATES } from '../constants/api';

/** Instance state from `getStateInstance`. */
export type InstanceState = (typeof INSTANCE_STATES)[number];

/** GREEN-API instance connection. */
export type TelegramApiCredentials = {
  /** API host. */
  apiUrl: string;
  /** Numeric instance id. */
  idInstance: string;
  /** Instance token. */
  apiTokenInstance: string;
};

/** Options for one Telegram request. */
export type TelegramRequestOptions = {
  /** Aborts the HTTP call. */
  signal?: AbortSignal;
};

/** HTTP call after the instance path is chosen. */
export type InstanceRequestConfig = TelegramRequestOptions & {
  /** HTTP method. */
  method: 'GET' | 'POST' | 'DELETE';
  /** Path after the token, with a leading slash. */
  suffix?: string;
  /** JSON body. */
  data?: unknown;
  /** Query string. */
  params?: Record<string, unknown>;
  /** Deadline in milliseconds. */
  timeout?: number;
};

/** Account that can be opened as a personal chat. */
export type CheckAccountFound = {
  /** Account exists. */
  kind: 'found';
  /** Personal chat id. Digits only. */
  chatId: string;
  /** Username from the API, including `@` when present. */
  username: string | null;
};

/** Account was not found. */
export type CheckAccountMissing = {
  /** Account does not exist or is hidden. */
  kind: 'missing';
};

/** `checkAccount` answered HTTP 200 and refused the check. */
export type CheckAccountRejected = {
  /** Check was refused. */
  kind: 'rejected';
  /** Reason from the body. Empty when omitted. */
  reason: string;
};

/** Result of a successful `checkAccount` call. Transport failures are thrown. */
export type CheckAccountResult = CheckAccountFound | CheckAccountMissing | CheckAccountRejected;

/** Text accepted by `sendMessage`. */
export type SendMessageInput = {
  /** Personal chat id. Digits only. */
  chatId: string;
  /** Text to enqueue. */
  message: string;
};

/** One queue item. Unsupported kinds keep `receiptId` and leave `text` empty. */
export type TelegramNotification = {
  /** Receipt used to acknowledge the event. */
  receiptId: number;
  /** Webhook name, for example `incomingMessageReceived`. */
  typeWebhook: string;
  /** Unix time in seconds. Null when the API omitted it. */
  timestamp: number | null;
  /** Server message id. Null when the event has none. */
  idMessage: string | null;
  /** Chat the event belongs to. */
  chatId: string | null;
  /** Telegram chat type, for example `user`. */
  chatType: string | null;
  /** Text of a plain or link message. Null otherwise. */
  text: string | null;
};

/** One text message from the chat journal. */
export type ChatHistoryMessage = {
  /** Server message id. */
  idMessage: string;
  /** Incoming or outgoing. */
  direction: 'incoming' | 'outgoing';
  /** Unix time in seconds. */
  timestamp: number;
  /** Text of a plain or link message. */
  text: string;
};

/** Telegram methods. Each call is one HTTP request and does not write store state. */
export type TelegramChatApi = {
  /** Reads the instance state. Unknown states are rejected. */
  getStateInstance: (credentials: TelegramApiCredentials, options?: TelegramRequestOptions) => Promise<InstanceState>;
  /** Resolves a phone number. `force` is not sent. */
  checkAccount: (
    credentials: TelegramApiCredentials,
    phoneNumber: string,
    options?: TelegramRequestOptions,
  ) => Promise<CheckAccountResult>;
  /** Enqueues one text message. A failed call is not retried. */
  sendMessage: (
    credentials: TelegramApiCredentials,
    input: SendMessageInput,
    options?: TelegramRequestOptions,
  ) => Promise<string>;
  /** Long-polls the next notification. An empty queue is null. */
  receiveNotification: (
    credentials: TelegramApiCredentials,
    options?: TelegramRequestOptions,
  ) => Promise<TelegramNotification | null>;
  /** Acknowledges one notification. The `result` flag is validated and ignored. */
  deleteNotification: (
    credentials: TelegramApiCredentials,
    receiptId: number,
    options?: TelegramRequestOptions,
  ) => Promise<void>;
  /** Clears the notification queue. The `isCleared` flag is validated and ignored. */
  clearWebhooksQueue: (credentials: TelegramApiCredentials, options?: TelegramRequestOptions) => Promise<void>;
  /** Reads the latest text messages. Non-text items are dropped. */
  getChatHistory: (
    credentials: TelegramApiCredentials,
    chatId: string,
    count: number,
    options?: TelegramRequestOptions,
  ) => Promise<ChatHistoryMessage[]>;
};
