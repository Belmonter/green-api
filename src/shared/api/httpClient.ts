import { create } from 'axios';

import type { HttpErrorKind } from './httpClient.types';

const MESSAGE: Record<HttpErrorKind, string> = {
  network: 'Network request failed',
  api: 'Request failed',
  abort: 'Request was cancelled',
  timeout: 'Request timed out',
  invalid: 'Response is invalid',
};

/** Normalized HTTP failure. */
export class HttpClientError extends Error {
  /** Failure category. */
  readonly kind: HttpErrorKind;
  /** HTTP status, when the server responded. */
  readonly status: number | undefined;

  constructor(kind: HttpErrorKind, status?: number) {
    super(MESSAGE[kind]);
    this.name = 'HttpClientError';
    this.kind = kind;
    this.status = status;
  }
}

/** Shared axios instance. */
export const fetcher = create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  transitional: {
    clarifyTimeoutError: true,
  },
});
