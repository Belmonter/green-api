import { useId } from 'react';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useForm } from 'react-hook-form';

import { useTelegramChatActions, useTelegramChats, useTelegramSession } from '@modules/TelegramChat';
import { FormField } from '@shared/ui/FormField';
import { PhoneInput } from '@shared/ui/PhoneInput';

import {
  createChatFailureMessage,
  createChatRefusalMessage,
  MISSING_ACCOUNT_MESSAGE,
} from '../../model/CreateChat.messages';
import { createChatSchema } from '../../model/CreateChat.schema';

import styles from './CreateChatForm.module.scss';

import type { CreateChatFormValuesType } from './CreateChatForm.types';

const emptyForm: CreateChatFormValuesType = {
  phoneNumber: '',
};

/** New-chat form. `checkAccount` runs on submit. */
export const CreateChatForm = () => {
  const baseId = useId();
  const { isConnected } = useTelegramSession();
  const { isCheckingAccount } = useTelegramChats();
  const { createChat, cancelCreateChat } = useTelegramChatActions();
  const form = useForm<CreateChatFormValuesType>({
    defaultValues: emptyForm,
    resolver: valibotResolver(createChatSchema),
  });
  const { errors, isSubmitting } = form.formState;
  const isBusy = isSubmitting || isCheckingAccount;
  const titleId = `${baseId}-title`;
  const phoneId = `${baseId}-phone`;
  const rootErrorId = `${baseId}-root`;

  const showFailure = (message: string) => {
    form.setError('root', { message });
    form.setFocus('phoneNumber');
  };

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('root');

    try {
      const result = await createChat({ phoneNumber: values.phoneNumber });

      if (result.outcome === 'opened') {
        form.reset(emptyForm);
        return;
      }

      if (result.outcome === 'missing') {
        showFailure(MISSING_ACCOUNT_MESSAGE);
        return;
      }

      if (result.outcome === 'refused') {
        showFailure(createChatRefusalMessage(result.reason));
      }
    } catch (error) {
      showFailure(createChatFailureMessage(error));
    }
  });

  if (!isConnected) {
    return null;
  }

  return (
    <form
      className={styles.form}
      method="post"
      autoComplete="off"
      noValidate
      aria-labelledby={titleId}
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <h2 id={titleId} className={styles.heading}>
        Новый чат
      </h2>
      <FormField
        id={phoneId}
        label="Номер телефона"
        hint="Международный номер с кодом страны. Номер форматируется автоматически, код страны не подставляется."
        error={errors.phoneNumber?.message}
        describedBy={errors.root?.message ? rootErrorId : undefined}
      >
        {(control) => (
          <PhoneInput
            autoComplete="tel"
            spellCheck={false}
            placeholder="+7 900 000 00 00"
            {...form.register('phoneNumber', {
              onChange: () => {
                form.clearErrors('root');
              },
            })}
            id={control.id}
            aria-invalid={control.invalid || Boolean(errors.root)}
            aria-errormessage={control.errorId ?? (errors.root?.message ? rootErrorId : undefined)}
            aria-describedby={control.describedBy}
          />
        )}
      </FormField>
      {errors.root?.message ? (
        <p id={rootErrorId} role="alert" className={styles.alert}>
          {errors.root.message}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button className={styles.submit} type="submit" disabled={isBusy}>
          {isBusy ? 'Проверяем номер…' : 'Открыть чат'}
        </button>
        {isBusy ? (
          <button className={styles.cancel} type="button" onClick={() => cancelCreateChat()}>
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
};
