import { type AsyncCtx, reatomAsync, withAbort } from '@reatom/framework';

import { telegramChatApi } from '../api/TelegramChat.api';
import { CHAT_HISTORY_COUNT } from '../constants/api';

import { isRequestCancellation, TelegramChatError, toFailureReason } from './TelegramChat.errors';
import { telegramChatStore } from './TelegramChat.store';
import { accountRefusalReason } from './TelegramChat.utils';

import type { CreateChatAccountRefusalReasonType, ConnectSessionInputType } from './TelegramChat.types';
import type { ChatHistoryMessage, InstanceState, TelegramApiCredentials } from '../api/TelegramChat.api.types';

/** Account that can be stored. */
type FoundAccountCheckType = {
  /** Existing account. */
  outcome: 'found';
  /** Chat id from the response. */
  chatId: string;
  /** Display name. Empty when the username is unusable. */
  displayName: string;
};

/** Account check before a chat is stored. */
type AccountCheckType =
  FoundAccountCheckType | { outcome: 'missing' } | { outcome: 'refused'; reason: CreateChatAccountRefusalReasonType };

/** Payload captured before `sendMessage`. */
type OutgoingRequestType = {
  /** Credentials at submit time. */
  credentials: TelegramApiCredentials;
  /** Destination chat id. */
  chatId: string;
  /** Validated text. */
  message: string;
};

const sessionSignal = (ctx: AsyncCtx): AbortSignal => {
  const session = ctx.get(telegramChatStore.sessionController)?.signal;

  return session ? AbortSignal.any([ctx.controller.signal, session]) : ctx.controller.signal;
};

const throwRequestError = (error: unknown, signal: AbortSignal): never => {
  if (signal.aborted || isRequestCancellation(error)) {
    throw error;
  }

  throw new TelegramChatError(toFailureReason(error));
};

/** Reads `getStateInstance`. A concurrent call keeps the running check. */
const connectInstance = reatomAsync(async (ctx, input: ConnectSessionInputType): Promise<InstanceState> => {
  const signal = sessionSignal(ctx);

  try {
    const stateInstance = await telegramChatApi.getStateInstance(input, { signal });

    signal.throwIfAborted();

    return stateInstance;
  } catch (error) {
    return throwRequestError(error, signal);
  }
}, 'telegramChatSaga.connectInstance').pipe(withAbort({ strategy: 'first-in-win' }));

/** Resolves a phone number. The chat is not stored here. */
const checkAccount = reatomAsync(async (ctx, phoneNumber: string): Promise<AccountCheckType> => {
  const signal = sessionSignal(ctx);
  const credentials = ctx.get(telegramChatStore.credentials);

  if (!credentials || ctx.get(telegramChatStore.sessionController) === null) {
    throw new TelegramChatError('rejected');
  }

  try {
    const response = await telegramChatApi.checkAccount(credentials, phoneNumber, { signal });

    signal.throwIfAborted();

    if (response.kind === 'found') {
      return {
        outcome: 'found',
        chatId: response.chatId,
        displayName: typeof response.username === 'string' ? response.username.trim() : '',
      };
    }

    if (response.kind === 'missing') {
      return { outcome: 'missing' };
    }

    return { outcome: 'refused', reason: accountRefusalReason(response.reason) };
  } catch (error) {
    return throwRequestError(error, signal);
  }
}, 'telegramChatSaga.checkAccount').pipe(withAbort({ strategy: 'first-in-win' }));

/** Reads one chat journal. Opening another chat cancels this request. */
const loadChatHistory = reatomAsync(async (ctx, chatId: string): Promise<ChatHistoryMessage[]> => {
  const signal = sessionSignal(ctx);
  const credentials = ctx.get(telegramChatStore.credentials);

  if (!credentials) {
    throw new TelegramChatError('rejected');
  }

  try {
    const messages = await telegramChatApi.getChatHistory(credentials, chatId, CHAT_HISTORY_COUNT, { signal });

    signal.throwIfAborted();

    return messages;
  } catch (error) {
    return throwRequestError(error, signal);
  }
}, 'telegramChatSaga.loadChatHistory').pipe(withAbort());

/** Sends one text. A newer send does not cancel this request. */
const sendMessage = reatomAsync(async (ctx, input: OutgoingRequestType): Promise<string> => {
  const signal = sessionSignal(ctx);

  try {
    const idMessage = await telegramChatApi.sendMessage(
      input.credentials,
      { chatId: input.chatId, message: input.message },
      { signal },
    );

    signal.throwIfAborted();

    return idMessage;
  } catch (error) {
    return throwRequestError(error, signal);
  }
}, 'telegramChatSaga.sendMessage');

/** Telegram chat requests. */
export const telegramChatSaga = {
  connectInstance,
  checkAccount,
  loadChatHistory,
  sendMessage,
};
