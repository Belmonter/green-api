/** Why an HTTP call failed. `abort` is caller cancellation. */
export type HttpErrorKind = 'network' | 'api' | 'abort' | 'timeout' | 'invalid';
