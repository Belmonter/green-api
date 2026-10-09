import { reatomAsync, withAbort } from '@reatom/framework';

import { telegramChatApi } from '../api/TelegramChat.api';
import { CHAT_ID_PATTERN } from '../constants/api';

import { RECEIVING_RETRY_BASE_DELAY_MS, RECEIVING_RETRY_MAX_DELAY_MS } from './TelegramChat.constants';
import { isFatalFailure, isRequestCancellation, toFailureReason } from './TelegramChat.errors';
import { telegramChatStore } from './TelegramChat.store';
import { acceptServerMessage, placeMessage } from './TelegramChat.utils';

import type { ServerMessageType, TelegramReceivingType } from './TelegramChat.types';
import type { TelegramNotification } from '../api/TelegramChat.api.types';
import type { Ctx } from '@reatom/framework';

/** Finished queue step, or a request to end the loop. */
type StepOutcomeType<T> =
  | {
      /** The loop must stop. */
      stopped: true;
    }
  | {
      /** The loop can continue. */
      stopped: false;
      /** Value returned by the step. */
      value: T;
    };

const SKIPPED_CHAT_TYPES = new Set(['group', 'supergroup', 'channel', 'bot']);

/** Writes the loop state unless the session ended or the state is the same. */
const setReceiving = (ctx: Ctx, signal: AbortSignal, next: TelegramReceivingType): void => {
  const current = ctx.get(telegramChatStore.receiving);

  if (signal.aborted || (current.status === next.status && current.reason === next.reason)) {
    return;
  }

  telegramChatStore.receiving(ctx, next);
};

/** Resolves after `delayMs` or as soon as the signal aborts. */
const wait = (delayMs: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, delayMs);

    signal.addEventListener('abort', finish, { once: true });
  });

/**
 * Runs one queue step. A temporary failure is retried with a delay that doubles up to the maximum.
 * A stopped step means the loop must stop.
 */
const runStep = async <T>(ctx: Ctx, signal: AbortSignal, step: () => Promise<T>): Promise<StepOutcomeType<T>> => {
  for (let attempt = 0; !signal.aborted; attempt += 1) {
    try {
      const value = await step();

      if (signal.aborted) {
        return { stopped: true };
      }

      setReceiving(ctx, signal, { status: 'running', reason: null });

      return { stopped: false, value };
    } catch (error) {
      if (signal.aborted || isRequestCancellation(error)) {
        return { stopped: true };
      }

      const reason = toFailureReason(error);

      if (isFatalFailure(reason)) {
        setReceiving(ctx, signal, { status: 'failed', reason });

        return { stopped: true };
      }

      setReceiving(ctx, signal, { status: 'retrying', reason });
      await wait(Math.min(RECEIVING_RETRY_BASE_DELAY_MS * 2 ** attempt, RECEIVING_RETRY_MAX_DELAY_MS), signal);
    }
  }

  return { stopped: true };
};

/**
 * Personal text from one queue item, or null when the item is skipped.
 * `text` is null for non-text events. Group ids start with a minus and fail `CHAT_ID_PATTERN`.
 */
const readNotification = (notification: TelegramNotification): ServerMessageType | null => {
  const { chatId, chatType, idMessage, text, timestamp } = notification;
  const isSkippedChat = chatType !== null && SKIPPED_CHAT_TYPES.has(chatType);

  if (isSkippedChat || text === null || idMessage === null || chatId === null || !CHAT_ID_PATTERN.test(chatId)) {
    return null;
  }

  return {
    chatId,
    idMessage,
    text,
    direction: notification.typeWebhook.toLowerCase().includes('outgoing') ? 'outgoing' : 'incoming',
    sentAt: timestamp !== null && timestamp >= 0 ? timestamp * 1000 : Date.now(),
  };
};

/** Writes the message into a listed chat. Other chats are ignored. */
const applyNotification = (ctx: Ctx, message: ServerMessageType): void => {
  if (!ctx.get(telegramChatStore.chats).some((chat) => chat.chatId === message.chatId)) {
    return;
  }

  const conversations = ctx.get(telegramChatStore.conversations);
  const next = placeMessage(conversations, acceptServerMessage(conversations[message.chatId] ?? [], message));

  if (next !== conversations) {
    telegramChatStore.conversations(ctx, next);
  }
};

/** Polls the queue: clear once, then apply and confirm one item at a time. */
export const receiveNotifications = reatomAsync(async (ctx) => {
  const controller = ctx.get(telegramChatStore.sessionController);
  const credentials = ctx.get(telegramChatStore.credentials);

  if (!controller || !credentials) {
    return;
  }

  const signal = AbortSignal.any([ctx.controller.signal, controller.signal]);
  const options = { signal };
  const cleared = await runStep(ctx, signal, () => telegramChatApi.clearWebhooksQueue(credentials, options));

  if (cleared.stopped) {
    return;
  }

  while (!signal.aborted) {
    const notification = await runStep(ctx, signal, () => telegramChatApi.receiveNotification(credentials, options));

    if (notification.stopped || signal.aborted) {
      return;
    }

    const item = notification.value;

    if (item === null) {
      continue;
    }

    const message = readNotification(item);

    if (message) {
      applyNotification(ctx, message);
    }

    const confirmed = await runStep(ctx, signal, () =>
      telegramChatApi.deleteNotification(credentials, item.receiptId, options),
    );

    if (confirmed.stopped) {
      return;
    }
  }
}, 'telegramChatNotifications.receiveNotifications').pipe(withAbort());
