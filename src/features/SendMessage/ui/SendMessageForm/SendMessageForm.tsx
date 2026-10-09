import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { outgoingTextIssue, useTelegramChatActions } from '@modules/TelegramChat';

import { outgoingTextError, sendErrorMessage, sendFailureMessage } from '../../model/SendMessage.messages';

import styles from './SendMessageForm.module.scss';

import type { SendMessageFormProps } from './SendMessageForm.types';

const IME_KEY_CODE = 229;

/** True while IME is composing Enter. */
const isImeEnter = (event: KeyboardEvent<HTMLTextAreaElement>, composing: boolean): boolean => {
  if (composing || event.nativeEvent.isComposing) {
    return true;
  }

  return event.nativeEvent.keyCode === IME_KEY_CODE;
};

/** Composer for the open chat. */
export const SendMessageForm = ({ chatId }: SendMessageFormProps) => {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useTelegramChatActions();
  const issue = outgoingTextIssue(draft);
  const lengthError = issue === 'too-long' ? outgoingTextError(issue) : null;
  const visibleError = error ?? lengthError;
  const canSend = issue === null && !isSending;

  const submitDraft = async () => {
    if (isSending) {
      return;
    }

    const nextIssue = outgoingTextIssue(draft);

    if (nextIssue) {
      setError(outgoingTextError(nextIssue));
      return;
    }

    const text = draft;
    const targetChatId = chatId;

    setIsSending(true);
    setError(null);

    try {
      const message = await sendMessage({ chatId: targetChatId, text });

      if (message.status === 'accepted') {
        setDraft((current) => (current === text ? '' : current));
        return;
      }

      if (message.sendFailure) {
        setError(sendFailureMessage(message.sendFailure));
      }
    } catch (sendError) {
      setError(sendErrorMessage(sendError));
    } finally {
      setIsSending(false);
      fieldRef.current?.focus();
    }
  };

  return (
    <form
      className={styles.composer}
      method="post"
      autoComplete="off"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submitDraft();
      }}
    >
      <label className={styles.label} htmlFor={fieldId}>
        Сообщение
      </label>
      <div className={styles.composerRow}>
        <textarea
          ref={fieldRef}
          id={fieldId}
          className={styles.input}
          rows={2}
          value={draft}
          aria-invalid={Boolean(visibleError)}
          aria-errormessage={visibleError ? errorId : undefined}
          aria-describedby={visibleError ? `${hintId} ${errorId}` : hintId}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={() => {
            isComposing.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || isImeEnter(event, isComposing.current) || isSending) {
              return;
            }

            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
        />
        <button
          className={styles.send}
          type="submit"
          disabled={!canSend}
          aria-label={isSending ? 'Отправляется…' : 'Отправить'}
          aria-busy={isSending}
        >
          <svg className={styles.sendIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </div>
      <p id={hintId} className={styles.hint}>
        Enter отправляет, Shift+Enter добавляет строку.
      </p>
      {visibleError ? (
        <p id={errorId} role="alert" className={error ? styles.alert : styles.error}>
          {visibleError}
        </p>
      ) : null}
    </form>
  );
};
