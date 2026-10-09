import { atom } from '@reatom/framework';

import { INITIAL_RECEIVING_STATE } from './TelegramChat.constants';

import type {
  ChatHistoryStatusesType,
  ChatHistoryStatusType,
  TelegramChatStoreType,
  TelegramConversationsType,
  TelegramMessageType,
  TelegramPersonalChatType,
} from './TelegramChat.types';
import type { TelegramApiCredentials } from '../api/TelegramChat.api.types';

const EMPTY_MESSAGES: readonly TelegramMessageType[] = [];

const credentials = atom<TelegramApiCredentials | null>(null, 'telegramChatStore.credentials');
const sessionController = atom<AbortController | null>(null, 'telegramChatStore.sessionController');
const chats = atom<TelegramPersonalChatType[]>([], 'telegramChatStore.chats');
const selectedChatId = atom<string | null>(null, 'telegramChatStore.selectedChatId');
const conversations = atom<TelegramConversationsType>({}, 'telegramChatStore.conversations');
const receiving = atom(INITIAL_RECEIVING_STATE, 'telegramChatStore.receiving');
const chatHistory = atom<ChatHistoryStatusesType>({}, 'telegramChatStore.chatHistory');

const selectedChat = atom((ctx) => {
  const chatId = ctx.spy(selectedChatId);

  if (!chatId) {
    return null;
  }

  return ctx.spy(chats).find((chat) => chat.chatId === chatId) ?? null;
}, 'telegramChatStore.selectedChat');

const selectedMessages = atom((ctx) => {
  const chatId = ctx.spy(selectedChatId);

  if (!chatId) {
    return EMPTY_MESSAGES;
  }

  return ctx.spy(conversations)[chatId] ?? EMPTY_MESSAGES;
}, 'telegramChatStore.selectedMessages');

const selectedHistoryStatus = atom((ctx): ChatHistoryStatusType => {
  const chatId = ctx.spy(selectedChatId);

  if (!chatId) {
    return 'idle';
  }

  return ctx.spy(chatHistory)[chatId] ?? 'idle';
}, 'telegramChatStore.selectedHistoryStatus');

/** Telegram chat state. */
export const telegramChatStore: TelegramChatStoreType = {
  credentials,
  sessionController,
  chats,
  selectedChatId,
  conversations,
  receiving,
  chatHistory,
  selectedChat,
  selectedMessages,
  selectedHistoryStatus,
};
