import { useTelegramChatActions, useTelegramSession } from '@modules/TelegramChat';

import styles from './DisconnectInstanceButton.module.scss';

/** Clears the local session. */
export const DisconnectInstanceButton = () => {
  const { isConnected } = useTelegramSession();
  const { disconnect } = useTelegramChatActions();

  if (!isConnected) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.button} type="button" onClick={() => disconnect()}>
        Отключиться
      </button>
      <p className={styles.note}>Сессия в приложении будет стёрта. Вход в Telegram в кабинете GREEN-API сохранится.</p>
    </div>
  );
};
