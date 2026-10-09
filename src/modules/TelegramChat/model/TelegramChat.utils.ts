import { formatPhoneNumber } from '@shared/lib';

import { MAX_MESSAGE_LENGTH, PHONE_INPUT_MAX_LENGTH, PHONE_NUMBER_PATTERN } from '../constants/api';

import type {
  CreateChatAccountRefusalReasonType,
  OutgoingTextIssueType,
  PersonalChatTitleType,
  ServerMessageType,
  TelegramConversationsType,
  TelegramMessageType,
  TelegramPersonalChatType,
} from './TelegramChat.types';
import type { ChatHistoryMessage } from '../api/TelegramChat.api.types';

/** Why text cannot be sent, or null. Length uses the original string. */
export const outgoingTextIssue = (text: unknown): OutgoingTextIssueType | null => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return 'empty';
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    return 'too-long';
  }

  return null;
};

/** International digits without a plus, or null. */
export const normalizeInternationalPhone = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > PHONE_INPUT_MAX_LENGTH) {
    return null;
  }

  const withoutPlus = trimmed.startsWith('+') ? trimmed.slice(1).trim() : trimmed;

  if (withoutPlus.length === 0 || withoutPlus.includes('+')) {
    return null;
  }

  if (!/^[\d\s().-]+$/.test(withoutPlus)) {
    return null;
  }

  const digits = withoutPlus.replace(/[\s().-]/g, '');

  if (!PHONE_NUMBER_PATTERN.test(digits)) {
    return null;
  }

  return digits;
};

/** Maps an HTTP 200 refusal to a category. */
export const accountRefusalReason = (reason: string): CreateChatAccountRefusalReasonType =>
  reason.toLowerCase().includes('rate') ? 'rate-limit' : 'rejected';

/** Display lines for a personal chat. */
export const personalChatTitle = (
  chat: Pick<TelegramPersonalChatType, 'chatId' | 'displayName' | 'phoneNumber'>,
): PersonalChatTitleType => {
  const phone = chat.phoneNumber ? formatPhoneNumber(chat.phoneNumber) : null;
  const title = chat.displayName || phone || chat.chatId;

  return {
    title,
    phone: chat.displayName && phone ? phone : null,
    accessibleName: chat.displayName && phone ? `${chat.displayName} ${phone}` : title,
  };
};

/** Inserts a chat or updates it in place. The same id keeps its position. */
export const placeChat = (chats: TelegramPersonalChatType[], chat: TelegramPersonalChatType) => {
  const index = chats.findIndex((item) => item.chatId === chat.chatId);
  const current = index === -1 ? undefined : chats[index];

  if (!current) {
    return { chats: [...chats, chat], chat };
  }

  if (current.phoneNumber === chat.phoneNumber && current.displayName === chat.displayName) {
    return { chats, chat: current };
  }

  return {
    chats: chats.map((item, itemIndex) => (itemIndex === index ? chat : item)),
    chat,
  };
};

const findByLocalId = (conversations: TelegramConversationsType, localId: string) => {
  for (const [chatId, messages] of Object.entries(conversations)) {
    const index = messages.findIndex((message) => message.localId === localId);
    const message = messages[index];

    if (message) {
      return { chatId, index, message };
    }
  }

  return null;
};

/** Stored message with this client id. */
export const findMessageByLocalId = (
  conversations: TelegramConversationsType,
  localId: string,
): TelegramMessageType | null => findByLocalId(conversations, localId)?.message ?? null;

/** Inserts or updates a message. A known server id is left as is. */
export const placeMessage = (
  conversations: TelegramConversationsType,
  message: TelegramMessageType,
): TelegramConversationsType => {
  const located = findByLocalId(conversations, message.localId);

  if (located) {
    const current = located.message;
    const idMessage =
      current.idMessage && message.idMessage && current.idMessage !== message.idMessage
        ? current.idMessage
        : (message.idMessage ?? current.idMessage);
    const sendFailure = message.status === 'failed' ? message.sendFailure : null;

    if (idMessage === current.idMessage && message.status === current.status && sendFailure === current.sendFailure) {
      return conversations;
    }

    const nextMessage: TelegramMessageType = {
      ...current,
      idMessage,
      status: message.status,
      sendFailure,
    };
    const messages = conversations[located.chatId] ?? [];

    return {
      ...conversations,
      [located.chatId]: messages.map((item, index) => (index === located.index ? nextMessage : item)),
    };
  }

  const knownServerMessage =
    message.idMessage !== null &&
    (conversations[message.chatId] ?? []).some((item) => item.idMessage === message.idMessage);

  if (knownServerMessage) {
    return conversations;
  }

  return {
    ...conversations,
    [message.chatId]: [...(conversations[message.chatId] ?? []), message],
  };
};

/** Unsent outgoing message with the same text. Prefers `pending`. */
export const findUnlinkedOutgoing = (
  messages: readonly TelegramMessageType[],
  text: string,
): TelegramMessageType | null => {
  const unlinked = (status: 'pending' | 'failed'): TelegramMessageType | null =>
    messages.find(
      (message) =>
        message.direction === 'outgoing' &&
        message.status === status &&
        message.idMessage === null &&
        message.text === text,
    ) ?? null;

  return unlinked('pending') ?? unlinked('failed');
};

/** Accepted message from a server copy. An outgoing copy reuses the local unsent bubble. */
export const acceptServerMessage = (
  messages: readonly TelegramMessageType[],
  entry: ServerMessageType,
): TelegramMessageType => {
  const local = entry.direction === 'outgoing' ? findUnlinkedOutgoing(messages, entry.text) : null;
  const base = local ?? { localId: globalThis.crypto.randomUUID(), ...entry };

  return { ...base, idMessage: entry.idMessage, status: 'accepted', sendFailure: null };
};

/** Merges journal rows into one chat, ordered by `sentAt`. */
export const mergeChatHistory = (
  conversations: TelegramConversationsType,
  chatId: string,
  history: readonly ChatHistoryMessage[],
): TelegramConversationsType => {
  let next = conversations;

  for (const entry of history) {
    const current = next[chatId] ?? [];
    const sentAt = entry.timestamp * 1000;

    if (current.some((message) => message.idMessage === entry.idMessage) || !Number.isSafeInteger(sentAt)) {
      continue;
    }

    next = placeMessage(
      next,
      acceptServerMessage(current, {
        chatId,
        idMessage: entry.idMessage,
        text: entry.text,
        direction: entry.direction,
        sentAt,
      }),
    );
  }

  if (next === conversations) {
    return conversations;
  }

  const messages = next[chatId];

  if (!messages) {
    return next;
  }

  return {
    ...next,
    [chatId]: [...messages].sort((left, right) => left.sentAt - right.sentAt),
  };
};
