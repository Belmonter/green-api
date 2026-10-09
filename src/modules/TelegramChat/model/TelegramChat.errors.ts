import { isAbort } from '@reatom/framework';

import { HttpClientError } from '@shared/api';

import type { RequestFailureReasonType } from './TelegramChat.types';

const TEMPORARY_FAILURES = new Set<RequestFailureReasonType>(['network', 'timeout', 'rate-limit', 'unavailable']);

/** Telegram request failure. */
export class TelegramChatError extends Error {
  /** Failure category. */
  readonly reason: RequestFailureReasonType;

  constructor(reason: RequestFailureReasonType) {
    super(reason);
    this.name = 'TelegramChatError';
    this.reason = reason;
  }
}

/** True when the caller cancelled the request. */
export const isRequestCancellation = (error: unknown): boolean =>
  isAbort(error) || (error instanceof HttpClientError && error.kind === 'abort');

/** Maps a failed request to a failure category. */
export const toFailureReason = (error: unknown): RequestFailureReasonType => {
  if (!(error instanceof HttpClientError)) {
    return error instanceof TelegramChatError ? error.reason : 'rejected';
  }

  switch (error.kind) {
    case 'network':
      return 'network';
    case 'timeout':
      return 'timeout';
    case 'invalid':
      return 'invalid-response';
    case 'api':
    case 'abort':
      break;
  }

  switch (error.status) {
    case 401:
      return 'invalid-credentials';
    case 429:
    case 469:
      return 'rate-limit';
    case 500:
    case 502:
      return 'unavailable';
    default:
      return 'rejected';
  }
};

/** True when retrying with the same credentials cannot succeed. */
export const isFatalFailure = (reason: RequestFailureReasonType): boolean => !TEMPORARY_FAILURES.has(reason);
