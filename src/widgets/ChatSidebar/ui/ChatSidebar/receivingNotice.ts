import type { ReceivingNoticeType } from './receivingNotice.types';
import type { RequestFailureReasonType, TelegramReceivingType } from '@modules/TelegramChat';

const RECEIVING_NOTICE: Record<RequestFailureReasonType, string> = {
  network: 'Нет соединения с GREEN-API. Получение уведомлений повторится автоматически.',
  timeout: 'GREEN-API не ответил вовремя. Получение уведомлений повторится автоматически.',
  'invalid-credentials': 'Неверный idInstance или токен. Получение уведомлений остановлено.',
  'rate-limit': 'Слишком много запросов к очереди. Получение уведомлений повторится автоматически.',
  'invalid-response': 'GREEN-API вернул неожиданный ответ очереди. Получение уведомлений остановлено.',
  unavailable: 'GREEN-API временно недоступен. Получение уведомлений повторится автоматически.',
  rejected: 'GREEN-API отклонил запрос очереди. Получение уведомлений остановлено.',
};

/** Notice for a stuck notification loop, or null. */
export const receivingNotice = (receiving: TelegramReceivingType): ReceivingNoticeType | null => {
  if ((receiving.status !== 'failed' && receiving.status !== 'retrying') || receiving.reason === null) {
    return null;
  }

  return {
    text: RECEIVING_NOTICE[receiving.reason],
    tone: receiving.status === 'failed' ? 'failed' : 'retry',
  };
};
