import { TelegramChatError } from '@modules/TelegramChat';

import type { CreateChatAccountRefusalReasonType, RequestFailureReasonType } from '@modules/TelegramChat';

const CREATE_CHAT_FAILURE_MESSAGES: Record<RequestFailureReasonType, string> = {
  network: 'Нет соединения с GREEN-API. Проверьте сеть и повторите.',
  timeout: 'GREEN-API не ответил вовремя. Повторите проверку номера.',
  'invalid-credentials': 'Неверный idInstance или токен. Подключитесь снова.',
  'rate-limit': 'Слишком много запросов. Подождите немного и повторите.',
  'invalid-response': 'GREEN-API вернул неожиданный ответ. Проверьте номер и повторите.',
  unavailable: 'Telegram временно недоступен. Повторите проверку номера позже.',
  rejected: 'Не удалось проверить номер. Повторите попытку.',
};

const REFUSAL_MESSAGES: Record<CreateChatAccountRefusalReasonType, string> = {
  'rate-limit': 'Слишком много проверок номера. Подождите немного и повторите.',
  rejected: 'GREEN-API отклонил проверку номера. Проверьте номер и состояние инстанса.',
};

/** Shown when Telegram has no account for the number. */
export const MISSING_ACCOUNT_MESSAGE =
  'Telegram не нашёл аккаунт с этим номером, или он скрыт настройками приватности. Проверьте номер и попробуйте снова.';

/** Text for an HTTP 200 refusal. */
export const createChatRefusalMessage = (reason: CreateChatAccountRefusalReasonType): string =>
  REFUSAL_MESSAGES[reason];

/** Text when the phone check fails. */
export const createChatFailureMessage = (error: unknown): string => {
  if (error instanceof TelegramChatError) {
    return CREATE_CHAT_FAILURE_MESSAGES[error.reason];
  }

  return 'Не удалось проверить номер. Повторите попытку.';
};
