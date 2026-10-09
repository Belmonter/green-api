import { useTelegramChatActions } from '@modules/TelegramChat';

import styles from './RetrySendButton.module.scss';

import type { RetrySendButtonProps } from './RetrySendButton.types';

/** Resends one failed message. */
export const RetrySendButton = ({ localId }: RetrySendButtonProps) => {
  const { retrySend } = useTelegramChatActions();

  return (
    <button
      className={styles.retry}
      type="button"
      onClick={() => {
        void retrySend(localId).catch(() => undefined);
      }}
    >
      Повторить отправку
    </button>
  );
};
