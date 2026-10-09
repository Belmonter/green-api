import { useId } from 'react';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useForm } from 'react-hook-form';

import { useTelegramChatActions, useTelegramSession } from '@modules/TelegramChat';
import { FormField } from '@shared/ui/FormField';

import { connectFailureMessage, unavailableInstanceMessage } from '../../model/ConnectInstance.messages';
import { connectInstanceSchema } from '../../model/ConnectInstance.schema';

import styles from './ConnectInstanceForm.module.scss';

import type { ConnectInstanceFormValuesType } from './ConnectInstanceForm.types';

const emptyForm: ConnectInstanceFormValuesType = {
  idInstance: '',
  apiTokenInstance: '',
  apiUrl: '',
};

/** Connection form. */
export const ConnectInstanceForm = () => {
  const baseId = useId();
  const { isConnecting } = useTelegramSession();
  const { connect, disconnect } = useTelegramChatActions();
  const form = useForm<ConnectInstanceFormValuesType>({
    defaultValues: emptyForm,
    resolver: valibotResolver(connectInstanceSchema),
  });
  const { errors, isSubmitting } = form.formState;
  const isBusy = isSubmitting || isConnecting;
  const idInstanceId = `${baseId}-id-instance`;
  const tokenId = `${baseId}-token`;
  const apiUrlId = `${baseId}-api-url`;
  const rootErrorId = `${baseId}-root`;

  const showFailure = (message: string) => {
    form.setError('root', { message });
    form.setFocus('idInstance');
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await connect(values);

      if (result.outcome === 'unavailable') {
        showFailure(unavailableInstanceMessage(result.instanceState));
      }
    } catch (error) {
      showFailure(connectFailureMessage(error));
    }
  });

  return (
    <form
      className={styles.form}
      method="post"
      autoComplete="off"
      noValidate
      aria-label="Подключение к GREEN-API"
      aria-describedby={errors.root?.message ? rootErrorId : undefined}
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <p className={styles.lead}>Токен остаётся только в памяти этой вкладки.</p>
      <FormField id={idInstanceId} label="idInstance" error={errors.idInstance?.message}>
        {(control) => (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            {...form.register('idInstance')}
            id={control.id}
            aria-invalid={control.invalid}
            aria-errormessage={control.errorId}
            aria-describedby={control.describedBy}
          />
        )}
      </FormField>
      <FormField id={tokenId} label="Токен API" error={errors.apiTokenInstance?.message}>
        {(control) => (
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            {...form.register('apiTokenInstance')}
            id={control.id}
            aria-invalid={control.invalid}
            aria-errormessage={control.errorId}
            aria-describedby={control.describedBy}
          />
        )}
      </FormField>
      <fieldset className={styles.settings}>
        <legend className={styles.legend}>Дополнительные настройки</legend>
        <FormField id={apiUrlId} label="Адрес API" hint="Адрес из кабинета GREEN-API." error={errors.apiUrl?.message}>
          {(control) => (
            <input
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://api.green-api.com"
              {...form.register('apiUrl')}
              id={control.id}
              aria-invalid={control.invalid}
              aria-errormessage={control.errorId}
              aria-describedby={control.describedBy}
            />
          )}
        </FormField>
      </fieldset>
      {errors.root?.message ? (
        <p id={rootErrorId} role="alert" className={styles.alert}>
          {errors.root.message}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button className={styles.submit} type="submit" disabled={isBusy}>
          {isBusy ? 'Проверяем инстанс…' : 'Подключиться'}
        </button>
        {isBusy ? (
          <button className={styles.cancel} type="button" onClick={() => disconnect()}>
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
};
