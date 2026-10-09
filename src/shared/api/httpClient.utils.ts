import { AxiosError, isAxiosError, isCancel } from 'axios';

import { HttpClientError } from './httpClient';

/** Maps an axios failure to `HttpClientError`. */
export const getHttpClientError = (error: unknown): HttpClientError => {
  if (isCancel(error)) {
    return new HttpClientError('abort');
  }

  if (isAxiosError(error)) {
    if (error.code === AxiosError.ETIMEDOUT || error.code === AxiosError.ECONNABORTED) {
      return new HttpClientError('timeout');
    }

    if (error.response) {
      return new HttpClientError('api', error.response.status);
    }
  }

  return new HttpClientError('network');
};
