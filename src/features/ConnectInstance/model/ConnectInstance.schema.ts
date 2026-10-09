import * as v from 'valibot';

import { API_TOKEN_PATTERN, greenApiOrigin, INSTANCE_ID_PATTERN } from '@modules/TelegramChat';

import type { ConnectInstanceFormValuesType } from '../ui/ConnectInstanceForm/ConnectInstanceForm.types';

/** Connection form schema. */
export const connectInstanceSchema: v.GenericSchema<ConnectInstanceFormValuesType> = v.object({
  idInstance: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Укажите idInstance.'),
    v.regex(INSTANCE_ID_PATTERN, 'idInstance должен быть числом из кабинета GREEN-API.'),
  ),
  apiTokenInstance: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Укажите токен API.'),
    v.regex(API_TOKEN_PATTERN, 'Токен содержит недопустимые символы или неверную длину.'),
  ),
  apiUrl: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Укажите адрес API из кабинета GREEN-API.'),
    v.check(
      (value) => greenApiOrigin(value) !== null,
      'Укажите HTTPS-адрес GREEN-API без пути и параметров, например https://api.green-api.com.',
    ),
  ),
});
