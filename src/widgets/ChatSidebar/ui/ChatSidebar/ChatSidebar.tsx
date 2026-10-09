import { useEffect, useId, useRef, useState } from 'react';

import { CreateChatForm } from '@features/CreateChat';
import { DisconnectInstanceButton } from '@features/DisconnectInstance';
import { personalChatTitle, useTelegramChatActions, useTelegramChats, useTelegramSession } from '@modules/TelegramChat';
import { focusIfObscured } from '@shared/lib';

import styles from './ChatSidebar.module.scss';
import { receivingNotice } from './receivingNotice';

import type { ChatSidebarProps } from './ChatSidebar.types';

/** Chat list. The new-chat form stays mounted while the panel is collapsed. */
export const ChatSidebar = ({ hidden, showSelectionPrompt }: ChatSidebarProps) => {
  const formId = useId();
  const [isFormOpen, setFormOpen] = useState(false);
  const chatButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const wasHidden = useRef(hidden);
  const lastChatId = useRef<string | null>(null);
  const { idInstance, apiUrl, receiving } = useTelegramSession();
  const queueNotice = receivingNotice(receiving);
  const { chats, selectedChatId, isCheckingAccount } = useTelegramChats();
  const { selectChat } = useTelegramChatActions();

  useEffect(() => {
    const revealed = wasHidden.current && !hidden;

    if (revealed) {
      const chatId = selectedChatId ?? lastChatId.current;

      focusIfObscured(chatId ? (chatButtonRefs.current.get(chatId) ?? null) : null);
    }

    if (selectedChatId) {
      lastChatId.current = selectedChatId;
    }

    wasHidden.current = hidden;
  }, [hidden, selectedChatId]);

  return (
    <section className={styles.sidebar} aria-label="Чаты" hidden={hidden}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Telegram</h1>
        <button
          className={styles.newChat}
          type="button"
          aria-expanded={isFormOpen}
          aria-controls={formId}
          disabled={isCheckingAccount}
          onClick={() => {
            setFormOpen((open) => !open);
          }}
        >
          {isFormOpen ? 'Скрыть форму' : 'Новый чат'}
        </button>
      </div>
      <div className={styles.body}>
        <p className={styles.status}>Инстанс авторизован</p>
        <dl className={styles.meta}>
          <div>
            <dt>idInstance</dt>
            <dd>{idInstance}</dd>
          </div>
          <div>
            <dt>Адрес API</dt>
            <dd>{apiUrl}</dd>
          </div>
        </dl>
        <p
          className={queueNotice?.tone === 'failed' ? styles.alert : queueNotice ? styles.warning : styles.live}
          role="status"
          aria-atomic="true"
        >
          {queueNotice?.text ?? ''}
        </p>
        <div id={formId} className={styles.form} hidden={!isFormOpen}>
          <CreateChatForm />
        </div>
        {showSelectionPrompt ? <p className={styles.prompt}>Выберите или создайте чат</p> : null}
        {chats.length === 0 && !showSelectionPrompt ? (
          <p className={styles.note}>Чатов пока нет. Создайте чат по номеру телефона.</p>
        ) : null}
        {chats.length > 0 ? (
          <ul className={styles.list} aria-label="Чаты">
            {chats.map((chat) => {
              const isActive = chat.chatId === selectedChatId;
              const shown = personalChatTitle(chat);

              return (
                <li key={chat.chatId}>
                  <button
                    className={styles.chatButton}
                    type="button"
                    aria-label={shown.accessibleName}
                    aria-current={isActive ? 'true' : undefined}
                    ref={(node) => {
                      if (node) {
                        chatButtonRefs.current.set(chat.chatId, node);
                        return;
                      }

                      chatButtonRefs.current.delete(chat.chatId);
                    }}
                    onClick={() => {
                      selectChat(chat.chatId);
                    }}
                  >
                    <span className={styles.chatTitle}>{shown.title}</span>
                    {shown.phone ? <span className={styles.chatPhone}>{shown.phone}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <footer className={styles.footer}>
        <DisconnectInstanceButton />
      </footer>
    </section>
  );
};
