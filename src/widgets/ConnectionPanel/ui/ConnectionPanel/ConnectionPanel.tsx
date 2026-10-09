import { ConnectInstanceForm } from '@features/ConnectInstance';

import styles from './ConnectionPanel.module.scss';

/** Sign-in panel. Unmounts after connect. */
export const ConnectionPanel = () => {
  return (
    <section className={styles.panel} aria-label="Подключение">
      <h1 className={styles.title}>Telegram</h1>
      <ConnectInstanceForm />
    </section>
  );
};
