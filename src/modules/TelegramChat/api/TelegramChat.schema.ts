import * as v from 'valibot';

import { INSTANCE_STATES } from '../constants/api';

/** Response of `getStateInstance`. */
export const stateSchema = v.object({
  stateInstance: v.picklist(INSTANCE_STATES),
});

/** Account that can be opened as a personal chat. */
const foundAccountSchema = v.object({
  exist: v.literal(true),
  chatId: v.pipe(v.string(), v.regex(/^\d+$/)),
  username: v.optional(v.string()),
});

/** Account that was not found. */
const missingAccountSchema = v.object({
  exist: v.literal(false),
  chatId: v.literal(''),
});

/** HTTP 200 refusal from `checkAccount`. */
const rejectedAccountSchema = v.object({
  status: v.literal(false),
  reason: v.optional(v.string()),
  data: v.optional(
    v.object({
      reason: v.optional(v.string()),
    }),
  ),
});

/** Response of `checkAccount`. */
export const accountSchema = v.union([foundAccountSchema, missingAccountSchema, rejectedAccountSchema]);

/** Response of `sendMessage`. */
export const sentMessageSchema = v.object({
  idMessage: v.pipe(v.string(), v.minLength(1)),
});

/** Response of `deleteNotification`. */
export const deletedNotificationSchema = v.object({
  result: v.boolean(),
});

/** Response of `clearWebhooksQueue`. */
export const clearedQueueSchema = v.object({
  isCleared: v.boolean(),
});

/** One item from `receiveNotification`. */
const notificationSchema = v.object({
  receiptId: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
  body: v.object({
    typeWebhook: v.optional(v.string()),
    timestamp: v.optional(v.pipe(v.number(), v.safeInteger())),
    idMessage: v.optional(v.pipe(v.string(), v.minLength(1))),
    senderData: v.optional(
      v.object({
        chatId: v.optional(v.string()),
        chatType: v.optional(v.string()),
      }),
    ),
    messageData: v.optional(
      v.object({
        typeMessage: v.optional(v.string()),
        textMessageData: v.optional(
          v.object({
            textMessage: v.optional(v.string()),
          }),
        ),
        extendedTextMessageData: v.optional(
          v.object({
            text: v.optional(v.string()),
          }),
        ),
      }),
    ),
  }),
});

/** Empty long-poll body. */
const emptyNotificationSchema = v.pipe(
  v.union([v.null(), v.undefined(), v.literal('')]),
  v.transform(() => null),
);

/** `receiveNotification` body. An empty queue is null. */
export const receivedNotificationSchema = v.union([emptyNotificationSchema, notificationSchema]);

/** One journal row before non-text items are dropped. */
export const chatHistoryItemSchema = v.object({
  type: v.picklist(['incoming', 'outgoing']),
  idMessage: v.pipe(v.string(), v.minLength(1)),
  timestamp: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
  typeMessage: v.optional(v.string()),
  chatId: v.optional(v.string()),
  textMessage: v.optional(v.string()),
  extendedTextMessage: v.optional(
    v.object({
      text: v.optional(v.string()),
    }),
  ),
  isDeleted: v.optional(v.boolean()),
});

/** Response of `getChatHistory`. */
export const chatHistorySchema = v.array(v.unknown());
