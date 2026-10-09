import { TelegramChatError } from '@modules/TelegramChat';

import type { RequestFailureReasonType, UnavailableInstanceStateType } from '@modules/TelegramChat';

const UNAVAILABLE_INSTANCE_MESSAGES: Record<UnavailableInstanceStateType, string> = {
  notAuthorized: 'Инстанс не авторизован в Telegram. Завершите вход в кабинете GREEN-API и повторите подключение.',
  blocked: 'Инстанс заблокирован. Подключение к чатам недоступно.',
  suspended: 'На аккаунте временные ограничения. Подключение к чатам сейчас недоступно.',
  starting: 'Инстанс запускается. Подождите несколько минут и повторите подключение.',
  pendingPassword: 'Для входа нужен пароль двухфакторной аутентификации. Завершите авторизацию в кабинете GREEN-API.',
};

const CONNECT_FAILURE_MESSAGES: Record<RequestFailureReasonType, string> = {
  network: 'Нет соединения с GREEN-API. Проверьте сеть и адрес API.',
  timeout: 'GREEN-API не ответил вовремя. Повторите подключение.',
  'invalid-credentials': 'Неверный idInstance или токен.',
  'rate-limit': 'Слишком много запросов к инстансу. Подождите немного и повторите.',
  'invalid-response': 'GREEN-API вернул неожиданный ответ. Проверьте адрес API.',
  unavailable: 'GREEN-API временно недоступен. Повторите подключение позже.',
  rejected: 'GREEN-API отклонил запрос. Проверьте idInstance, токен и адрес.',
};

/** Text for an instance state that does not open a chat. */
export const unavailableInstanceMessage = (state: UnavailableInstanceStateType): string =>
  UNAVAILABLE_INSTANCE_MESSAGES[state];

/** Text when the connection check fails. */
export const connectFailureMessage = (error: unknown): string => {
  if (error instanceof TelegramChatError) {
    return CONNECT_FAILURE_MESSAGES[error.reason];
  }

  return 'Не удалось проверить инстанс. Повторите подключение.';
};
