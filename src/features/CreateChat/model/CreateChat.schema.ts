import * as v from 'valibot';

import { normalizeInternationalPhone } from '@modules/TelegramChat';

import type { CreateChatFormValuesType } from '../ui/CreateChatForm/CreateChatForm.types';

/** Phone form schema. */
export const createChatSchema: v.GenericSchema<CreateChatFormValuesType> = v.object({
  phoneNumber: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Укажите номер телефона.'),
    v.check(
      (value) => normalizeInternationalPhone(value) !== null,
      'Укажите международный номер с кодом страны: от 8 до 15 цифр. Код страны не добавляется автоматически.',
    ),
  ),
});
