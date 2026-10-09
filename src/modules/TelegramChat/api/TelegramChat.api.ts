import * as v from 'valibot';

import { HttpClientError, fetcher, getHttpClientError } from '@shared/api';

import { TEXT_MESSAGE_TYPE } from '../constants/api';

import {
  accountSchema,
  chatHistoryItemSchema,
  chatHistorySchema,
  clearedQueueSchema,
  deletedNotificationSchema,
  receivedNotificationSchema,
  sentMessageSchema,
  stateSchema,
} from './TelegramChat.schema';

import type {
  ChatHistoryMessage,
  CheckAccountResult,
  InstanceRequestConfig,
  TelegramApiCredentials,
  TelegramChatApi,
  TelegramNotification,
} from './TelegramChat.api.types';

/** Timeout for calls that do not long-poll, in milliseconds. */
const DEFAULT_HTTP_TIMEOUT_MS = 15_000;

/** `receiveNotification` wait, in seconds. */
const RECEIVE_TIMEOUT_SECONDS = 20;

/** Extra milliseconds so the HTTP deadline outlasts the long poll. */
const RECEIVE_TIMEOUT_HTTP_MARGIN_MS = 10_000;

const request = async <T>(
  credentials: TelegramApiCredentials,
  method: string,
  schema: v.GenericSchema<unknown, T>,
  config: InstanceRequestConfig,
): Promise<T> => {
  const response = await fetcher<unknown>({
    baseURL: credentials.apiUrl,
    url: `waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${config.suffix ?? ''}`,
    method: config.method,
    data: config.data,
    params: config.params,
    timeout: config.timeout ?? DEFAULT_HTTP_TIMEOUT_MS,
    signal: config.signal,
  }).catch((error: unknown) => {
    throw getHttpClientError(error);
  });

  const parsed = v.safeParse(schema, response.data);

  if (!parsed.success) {
    throw new HttpClientError('invalid', response.status);
  }

  return parsed.output;
};

const pickText = <T>(typeMessage: string | undefined, plain: T, extended: T): T | undefined => {
  if (typeMessage === TEXT_MESSAGE_TYPE.plain) {
    return plain;
  }

  if (typeMessage === TEXT_MESSAGE_TYPE.extended) {
    return extended;
  }

  return undefined;
};

const toNotification = ({
  receiptId,
  body,
}: NonNullable<v.InferOutput<typeof receivedNotificationSchema>>): TelegramNotification => ({
  receiptId,
  typeWebhook: body.typeWebhook ?? '',
  timestamp: body.timestamp ?? null,
  idMessage: body.idMessage ?? null,
  chatId: body.senderData?.chatId ?? null,
  chatType: body.senderData?.chatType ?? null,
  text:
    pickText(
      body.messageData?.typeMessage,
      body.messageData?.textMessageData?.textMessage,
      body.messageData?.extendedTextMessageData?.text,
    ) ?? null,
});

const readHistoryItem = (item: unknown, chatId: string): ChatHistoryMessage | null => {
  const parsed = v.safeParse(chatHistoryItemSchema, item);

  if (!parsed.success) {
    return null;
  }

  const entry = parsed.output;
  const sameChat = entry.chatId === undefined || entry.chatId === chatId;
  const text = pickText(entry.typeMessage, entry.textMessage, entry.extendedTextMessage?.text ?? entry.textMessage);

  if (!sameChat || entry.isDeleted === true || text === undefined) {
    return null;
  }

  return { idMessage: entry.idMessage, direction: entry.type, timestamp: entry.timestamp, text };
};

const toCheckAccount = (body: v.InferOutput<typeof accountSchema>): CheckAccountResult => {
  if (!('exist' in body)) {
    return { kind: 'rejected', reason: body.reason ?? body.data?.reason ?? '' };
  }

  if (!body.exist) {
    return { kind: 'missing' };
  }

  return { kind: 'found', chatId: body.chatId, username: body.username ?? null };
};

const getStateInstance: TelegramChatApi['getStateInstance'] = async (credentials, options) => {
  const body = await request(credentials, 'getStateInstance', stateSchema, { method: 'GET', ...options });

  return body.stateInstance;
};

const checkAccount: TelegramChatApi['checkAccount'] = async (credentials, phoneNumber, options) => {
  const body = await request(credentials, 'checkAccount', accountSchema, {
    method: 'POST',
    data: { phoneNumber: Number(phoneNumber) },
    ...options,
  });

  return toCheckAccount(body);
};

const sendMessage: TelegramChatApi['sendMessage'] = async (credentials, input, options) => {
  const body = await request(credentials, 'sendMessage', sentMessageSchema, {
    method: 'POST',
    data: { chatId: input.chatId, message: input.message },
    ...options,
  });

  return body.idMessage;
};

const receiveNotification: TelegramChatApi['receiveNotification'] = async (credentials, options) => {
  const body = await request(credentials, 'receiveNotification', receivedNotificationSchema, {
    method: 'GET',
    params: { receiveTimeout: RECEIVE_TIMEOUT_SECONDS },
    timeout: RECEIVE_TIMEOUT_SECONDS * 1000 + RECEIVE_TIMEOUT_HTTP_MARGIN_MS,
    ...options,
  });

  return body === null ? null : toNotification(body);
};

const deleteNotification: TelegramChatApi['deleteNotification'] = async (credentials, receiptId, options) => {
  await request(credentials, 'deleteNotification', deletedNotificationSchema, {
    method: 'DELETE',
    suffix: `/${receiptId}`,
    ...options,
  });
};

const clearWebhooksQueue: TelegramChatApi['clearWebhooksQueue'] = async (credentials, options) => {
  await request(credentials, 'clearWebhooksQueue', clearedQueueSchema, { method: 'DELETE', ...options });
};

const getChatHistory: TelegramChatApi['getChatHistory'] = async (credentials, chatId, count, options) => {
  const body = await request(credentials, 'getChatHistory', chatHistorySchema, {
    method: 'POST',
    data: { chatId, count },
    ...options,
  });

  return body.map((item) => readHistoryItem(item, chatId)).filter((item) => item !== null);
};

/** GREEN-API methods. They do not write store state. */
export const telegramChatApi: TelegramChatApi = {
  getStateInstance,
  checkAccount,
  sendMessage,
  receiveNotification,
  deleteNotification,
  clearWebhooksQueue,
  getChatHistory,
};
