import { MAX_MESSAGE_LENGTH } from '@modules/TelegramChat';

import type { OutgoingTextIssueType, RequestFailureReasonType, TelegramMessageType } from '@modules/TelegramChat';

const SEND_FAILURE_MESSAGES: Record<RequestFailureReasonType, string> = {
  network: 'Нет соединения с GREEN-API. Текст сохранён, отправьте его ещё раз.',
  timeout:
    'Неизвестно, дошло ли сообщение до GREEN-API. Повтор может создать дубликат. Отправьте ещё раз только если это нужно.',
  'invalid-credentials': 'Неверный idInstance или токен. Подключитесь снова. Текст сообщения сохранён.',
  'rate-limit': 'Слишком много отправок. Подождите немного и повторите. Текст сообщения сохранён.',
  'invalid-response': 'GREEN-API вернул неожиданный ответ. Текст сохранён, отправьте его ещё раз.',
  unavailable: 'Telegram временно недоступен. Текст сохранён, повторите отправку позже.',
  rejected: 'Не удалось отправить сообщение. Текст сохранён, повторите попытку.',
};

const OUTGOING_TEXT_MESSAGES: Record<OutgoingTextIssueType, string> = {
  empty: 'Введите текст сообщения.',
  'too-long': `Сообщение длиннее ${MAX_MESSAGE_LENGTH} символов.`,
};

/** Text for a text-length or empty-message error. */
export const outgoingTextError = (issue: OutgoingTextIssueType): string => OUTGOING_TEXT_MESSAGES[issue];

/** Text for a failed send. */
export const sendFailureMessage = (reason: RequestFailureReasonType): string => SEND_FAILURE_MESSAGES[reason];

/** Text when `sendMessage` throws. */
export const sendErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message === 'not connected') {
    return 'Нет подключения к инстансу. Подключитесь снова.';
  }

  if (error instanceof Error && error.message === 'unknown chat') {
    return 'Чат не найден. Откройте его снова.';
  }

  return 'Не удалось отправить сообщение. Текст сохранён, повторите попытку.';
};

/** Status line for an outgoing message. */
export const outgoingStatusText = (
  message: Pick<TelegramMessageType, 'direction' | 'status' | 'sendFailure'>,
): string | null => {
  if (message.direction !== 'outgoing') {
    return null;
  }

  if (message.status === 'pending') {
    return 'Отправляется';
  }

  if (message.status === 'accepted') {
    return 'Принято к отправке';
  }

  if (message.sendFailure) {
    return sendFailureMessage(message.sendFailure);
  }

  return 'Не удалось отправить сообщение. Текст сохранён, повторите попытку.';
};
