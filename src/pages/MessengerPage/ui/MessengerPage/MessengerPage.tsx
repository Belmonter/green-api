import { useTelegramChats, useTelegramSession } from '@modules/TelegramChat';
import { ChatSidebar } from '@widgets/ChatSidebar';
import { ChatWindow } from '@widgets/ChatWindow';
import { ConnectionPanel } from '@widgets/ConnectionPanel';

import styles from './MessengerPage.module.scss';
import { useNarrowViewport } from './useNarrowViewport';

/** Messenger. Shows the connection form until the instance is authorized. */
export const MessengerPage = () => {
  const { isConnected } = useTelegramSession();
  const { selectedChatId } = useTelegramChats();
  const isNarrow = useNarrowViewport();
  const showList = !isNarrow || selectedChatId === null;
  const showConversation = !isNarrow || selectedChatId !== null;

  if (!isConnected) {
    return (
      <main className={styles.gate}>
        <ConnectionPanel />
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <ChatSidebar hidden={!showList} showSelectionPrompt={isNarrow && selectedChatId === null} />
      <ChatWindow hidden={!showConversation} showBackToList={isNarrow && selectedChatId !== null} />
    </main>
  );
};
