import { action } from '@reatom/framework';

import { greenApiOrigin } from '../constants/api';

import { INITIAL_RECEIVING_STATE } from './TelegramChat.constants';
import { isRequestCancellation, TelegramChatError, toFailureReason } from './TelegramChat.errors';
import { receiveNotifications } from './TelegramChat.notifications';
import { telegramChatSaga } from './TelegramChat.saga';
import { telegramChatStore } from './TelegramChat.store';
import {
  findMessageByLocalId,
  mergeChatHistory,
  normalizeInternationalPhone,
  outgoingTextIssue,
  placeChat,
  placeMessage,
} from './TelegramChat.utils';

import type {
  ChatHistoryStatusType,
  ConnectSessionInputType,
  ConnectSessionResultType,
  CreateChatInputType,
  CreateChatResultType,
  SendMessageInputType,
  TelegramMessageType,
  TelegramPersonalChatType,
} from './TelegramChat.types';
import type { TelegramApiCredentials } from '../api/TelegramChat.api.types';
import type { Ctx } from '@reatom/framework';

const clearSessionData = (ctx: Ctx): void => {
  telegramChatStore.credentials(ctx, null);
  telegramChatStore.chats(ctx, []);
  telegramChatStore.selectedChatId(ctx, null);
  telegramChatStore.conversations(ctx, {});
  telegramChatStore.receiving(ctx, INITIAL_RECEIVING_STATE);
  telegramChatStore.chatHistory(ctx, {});
};

const activeSession = (ctx: Ctx, controller: AbortController): boolean =>
  ctx.get(telegramChatStore.sessionController) === controller && !controller.signal.aborted;

/** Aborts in-flight requests and clears the session. */
const resetSession = (ctx: Ctx): void => {
  const current = ctx.get(telegramChatStore.sessionController);

  current?.abort();
  telegramChatStore.sessionController(ctx, null);
  clearSessionData(ctx);
};

/** Starts a session and the notification loop. */
const startSession = (ctx: Ctx, input: TelegramApiCredentials): void => {
  const previous = ctx.get(telegramChatStore.sessionController);

  previous?.abort();

  const controller = new AbortController();

  telegramChatStore.sessionController(ctx, controller);
  clearSessionData(ctx);
  telegramChatStore.credentials(ctx, input);
  telegramChatStore.receiving(ctx, { status: 'running', reason: null });
  void ctx.schedule(() => receiveNotifications(ctx));
};

const setChatHistoryStatus = (ctx: Ctx, chatId: string, status: ChatHistoryStatusType): void => {
  const current = ctx.get(telegramChatStore.chatHistory);

  if (current[chatId] !== status) {
    telegramChatStore.chatHistory(ctx, { ...current, [chatId]: status });
  }
};

const storeMessage = (ctx: Ctx, controller: AbortController, message: TelegramMessageType): TelegramMessageType => {
  if (!activeSession(ctx, controller)) {
    return message;
  }

  const conversations = ctx.get(telegramChatStore.conversations);
  const next = placeMessage(conversations, message);

  if (next !== conversations) {
    telegramChatStore.conversations(ctx, next);
  }

  return findMessageByLocalId(next, message.localId) ?? message;
};

/** Settles a pending outgoing message, or marks it failed. */
const settleOutgoing = (
  ctx: Ctx,
  controller: AbortController,
  message: TelegramMessageType,
  patch: Pick<TelegramMessageType, 'status' | 'idMessage' | 'sendFailure'>,
): TelegramMessageType => {
  if (!activeSession(ctx, controller)) {
    return findMessageByLocalId(ctx.get(telegramChatStore.conversations), message.localId) ?? message;
  }

  const current = findMessageByLocalId(ctx.get(telegramChatStore.conversations), message.localId);

  if (current?.status === 'accepted' && current.idMessage) {
    return current;
  }

  return storeMessage(ctx, controller, {
    ...(current ?? message),
    idMessage: patch.idMessage,
    status: patch.status,
    sendFailure: patch.status === 'failed' ? patch.sendFailure : null,
  });
};

/** Sends a message already stored as `pending`. */
const deliver = async (
  ctx: Ctx,
  controller: AbortController,
  credentials: TelegramApiCredentials,
  message: TelegramMessageType,
): Promise<TelegramMessageType> => {
  try {
    const idMessage = await ctx.schedule(() =>
      telegramChatSaga.sendMessage(ctx, {
        credentials,
        chatId: message.chatId,
        message: message.text,
      }),
    );

    controller.signal.throwIfAborted();

    return settleOutgoing(ctx, controller, message, {
      idMessage,
      status: 'accepted',
      sendFailure: null,
    });
  } catch (error) {
    if (controller.signal.aborted || isRequestCancellation(error)) {
      return findMessageByLocalId(ctx.get(telegramChatStore.conversations), message.localId) ?? message;
    }

    return settleOutgoing(ctx, controller, message, {
      idMessage: message.idMessage,
      status: 'failed',
      sendFailure: toFailureReason(error),
    });
  }
};

/** Starts a session when the instance is `authorized`. A disallowed API host is rejected before the request. */
const connectAction = action(async (ctx, input: ConnectSessionInputType): Promise<ConnectSessionResultType> => {
  const apiUrl = greenApiOrigin(input.apiUrl);

  if (!apiUrl) {
    throw new Error('apiUrl is not allowed');
  }

  const credentials: TelegramApiCredentials = {
    apiUrl,
    idInstance: input.idInstance,
    apiTokenInstance: input.apiTokenInstance,
  };

  try {
    const stateInstance = await ctx.schedule(() => telegramChatSaga.connectInstance(ctx, credentials));

    if (stateInstance !== 'authorized') {
      return { outcome: 'unavailable', instanceState: stateInstance };
    }

    startSession(ctx, credentials);

    return { outcome: 'connected' };
  } catch (error) {
    if (isRequestCancellation(error)) {
      return { outcome: 'aborted' };
    }

    throw error instanceof TelegramChatError ? error : new TelegramChatError(toFailureReason(error));
  }
}, 'telegramChatActions.connectAction');

/** Clears the local session. Does not log out of GREEN-API. */
const disconnectAction = action((ctx) => {
  telegramChatSaga.connectInstance.abort(ctx);
  telegramChatSaga.checkAccount.abort(ctx);
  resetSession(ctx);
}, 'telegramChatActions.disconnectAction');

/** Cancels the phone check. */
const cancelCreateChatAction = action((ctx) => {
  telegramChatSaga.checkAccount.abort(ctx);
}, 'telegramChatActions.cancelCreateChatAction');

/** Loads a chat journal once per session. A failed load can be retried. */
const loadChatHistoryAction = action(async (ctx, chatId: string): Promise<void> => {
  const controller = ctx.get(telegramChatStore.sessionController);

  if (
    !controller ||
    !ctx.get(telegramChatStore.credentials) ||
    !ctx.get(telegramChatStore.chats).some((chat) => chat.chatId === chatId)
  ) {
    return;
  }

  const status = ctx.get(telegramChatStore.chatHistory)[chatId];

  if (status === 'loading' || status === 'loaded') {
    return;
  }

  setChatHistoryStatus(ctx, chatId, 'loading');

  try {
    const messages = await ctx.schedule(() => telegramChatSaga.loadChatHistory(ctx, chatId));

    if (!activeSession(ctx, controller)) {
      return;
    }

    const conversations = ctx.get(telegramChatStore.conversations);
    const merged = mergeChatHistory(conversations, chatId, messages);

    if (merged !== conversations) {
      telegramChatStore.conversations(ctx, merged);
    }

    setChatHistoryStatus(ctx, chatId, 'loaded');
  } catch (error) {
    if (!activeSession(ctx, controller)) {
      return;
    }

    setChatHistoryStatus(ctx, chatId, isRequestCancellation(error) ? 'idle' : 'failed');
  }
}, 'telegramChatActions.loadChatHistoryAction');

/** Selects a listed chat and starts its journal load. */
const selectChatAction = action((ctx, chatId: string | null): string | null => {
  const currentChatId = ctx.get(telegramChatStore.selectedChatId);

  if (chatId === currentChatId) {
    return currentChatId;
  }

  if (chatId !== null && !ctx.get(telegramChatStore.chats).some((chat) => chat.chatId === chatId)) {
    return currentChatId;
  }

  telegramChatStore.selectedChatId(ctx, chatId);

  if (chatId !== null) {
    void loadChatHistoryAction(ctx, chatId);
  }

  return chatId;
}, 'telegramChatActions.selectChatAction');

const rememberChat = (
  ctx: Ctx,
  controller: AbortController,
  chat: TelegramPersonalChatType,
): TelegramPersonalChatType | null => {
  if (!activeSession(ctx, controller)) {
    return null;
  }

  const currentChats = ctx.get(telegramChatStore.chats);
  const placed = placeChat(currentChats, chat);

  if (placed.chats !== currentChats) {
    telegramChatStore.chats(ctx, placed.chats);
  }

  return placed.chat;
};

/** Opens a personal chat by phone. A known local number skips the request. */
const createChatAction = action(async (ctx, input: CreateChatInputType): Promise<CreateChatResultType> => {
  const phoneNumber = normalizeInternationalPhone(input.phoneNumber);

  if (!phoneNumber) {
    throw new Error('phoneNumber must be an international number');
  }

  const controller = ctx.get(telegramChatStore.sessionController);

  if (!controller || ctx.get(telegramChatStore.credentials) === null) {
    return { outcome: 'not-connected' };
  }

  const existing = ctx.get(telegramChatStore.chats).find((chat) => chat.phoneNumber === phoneNumber);

  if (existing) {
    selectChatAction(ctx, existing.chatId);

    return { outcome: 'opened', existed: true, chat: existing };
  }

  try {
    const checked = await ctx.schedule(() => telegramChatSaga.checkAccount(ctx, phoneNumber));

    if (!activeSession(ctx, controller)) {
      return { outcome: 'aborted' };
    }

    if (checked.outcome !== 'found') {
      return checked;
    }

    const existed = ctx.get(telegramChatStore.chats).some((chat) => chat.chatId === checked.chatId);
    const chat = rememberChat(ctx, controller, {
      chatId: checked.chatId,
      phoneNumber,
      displayName: checked.displayName,
    });

    if (!chat) {
      return { outcome: 'aborted' };
    }

    selectChatAction(ctx, chat.chatId);

    return { outcome: 'opened', existed, chat };
  } catch (error) {
    if (isRequestCancellation(error) || !activeSession(ctx, controller)) {
      return { outcome: 'aborted' };
    }

    throw error instanceof TelegramChatError ? error : new TelegramChatError(toFailureReason(error));
  }
}, 'telegramChatActions.createChatAction');

/** Sends text to the chat in the input. Rejects when the text or session is invalid. */
const sendMessageAction = action(async (ctx, input: SendMessageInputType): Promise<TelegramMessageType> => {
  if (outgoingTextIssue(input.text)) {
    throw new Error('text cannot be sent');
  }

  const controller = ctx.get(telegramChatStore.sessionController);
  const credentials = ctx.get(telegramChatStore.credentials);

  if (!controller || !credentials) {
    throw new Error('not connected');
  }

  if (!ctx.get(telegramChatStore.chats).some((chat) => chat.chatId === input.chatId)) {
    throw new Error('unknown chat');
  }

  const message: TelegramMessageType = {
    localId: globalThis.crypto.randomUUID(),
    idMessage: null,
    chatId: input.chatId,
    text: input.text,
    direction: 'outgoing',
    sentAt: Date.now(),
    status: 'pending',
    sendFailure: null,
  };

  storeMessage(ctx, controller, message);

  return deliver(ctx, controller, credentials, message);
}, 'telegramChatActions.sendMessageAction');

/** Resends a failed outgoing message. A pending send is left as is. */
const retrySendAction = action(async (ctx, localId: string): Promise<TelegramMessageType> => {
  const controller = ctx.get(telegramChatStore.sessionController);
  const credentials = ctx.get(telegramChatStore.credentials);

  if (!controller || !credentials) {
    throw new Error('not connected');
  }

  const current = findMessageByLocalId(ctx.get(telegramChatStore.conversations), localId);

  if (!current || current.direction !== 'outgoing') {
    throw new Error('outgoing message was not found');
  }

  if (current.status === 'pending' || current.status === 'accepted') {
    return current;
  }

  if (outgoingTextIssue(current.text)) {
    throw new Error('text cannot be sent');
  }

  const pending = storeMessage(ctx, controller, {
    ...current,
    status: 'pending',
    sendFailure: null,
  });

  return deliver(ctx, controller, credentials, pending);
}, 'telegramChatActions.retrySendAction');

/** Telegram chat commands. */
export const telegramChatActions = {
  connectAction,
  disconnectAction,
  cancelCreateChatAction,
  selectChatAction,
  loadChatHistoryAction,
  createChatAction,
  sendMessageAction,
  retrySendAction,
};
