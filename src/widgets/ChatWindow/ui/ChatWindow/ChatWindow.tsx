import { useEffect, useRef } from 'react';

import { outgoingStatusText, RetrySendButton, SendMessageForm } from '@features/SendMessage';
import {
  personalChatTitle,
  useTelegramChatActions,
  useTelegramChats,
  useTelegramMessages,
} from '@modules/TelegramChat';
import { focusIfObscured } from '@shared/lib';

import styles from './ChatWindow.module.scss';
import { formatMessageTime } from './formatMessageTime';
import { useStickToBottom } from './useStickToBottom';

import type { ChatWindowProps } from './ChatWindow.types';

/** Open conversation. Message text is not parsed as HTML. */
export const ChatWindow = ({ hidden, showBackToList }: ChatWindowProps) => {
  const backRef = useRef<HTMLButtonElement>(null);
  const { selectedChat } = useTelegramChats();
  const { messages, historyStatus } = useTelegramMessages();
  const { selectChat, loadChatHistory } = useTelegramChatActions();
  const shown = selectedChat ? personalChatTitle(selectedChat) : null;
  const isLoadingHistory = historyStatus === 'loading';
  const { listRef, onScroll } = useStickToBottom({
    chatId: selectedChat?.chatId ?? null,
    messages,
    hidden,
  });

  useEffect(() => {
    if (!showBackToList) {
      return;
    }

    focusIfObscured(backRef.current);
  }, [showBackToList, selectedChat?.chatId]);

  return (
    <section className={styles.window} aria-label="Переписка" hidden={hidden}>
      {selectedChat ? (
        <>
          <header className={styles.header}>
            {showBackToList ? (
              <button
                ref={backRef}
                className={styles.back}
                type="button"
                onClick={() => {
                  selectChat(null);
                }}
              >
                К списку чатов
              </button>
            ) : null}
            <h2 className={styles.title} aria-label={shown?.accessibleName}>
              <span>{shown?.title}</span>
              {shown?.phone ? <span className={styles.phone}>{shown.phone}</span> : null}
            </h2>
          </header>
          {historyStatus === 'failed' ? (
            <div className={styles.historyError} role="alert">
              <p className={styles.historyErrorText}>Не удалось загрузить историю переписки.</p>
              <button
                className={styles.historyRetry}
                type="button"
                onClick={() => {
                  void loadChatHistory(selectedChat.chatId);
                }}
              >
                Повторить
              </button>
            </div>
          ) : null}
          {messages.length === 0 ? (
            <div className={styles.empty} role={isLoadingHistory ? 'status' : undefined}>
              <p className={styles.emptyTitle}>{isLoadingHistory ? 'Загружаем переписку…' : 'Переписка пуста'}</p>
              {isLoadingHistory ? null : (
                <p className={styles.emptyHint}>Напишите сообщение. Оно появится в этом чате.</p>
              )}
            </div>
          ) : (
            <div
              ref={listRef}
              className={styles.messages}
              // The thread is the scrollport, so the keyboard can move through earlier messages.
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              role="region"
              aria-label="Сообщения"
              onScroll={onScroll}
            >
              <ol className={styles.thread}>
                {messages.map((message) => {
                  const directionLabel = message.direction === 'incoming' ? 'Входящее' : 'Исходящее';

                  const statusText = outgoingStatusText(message);

                  return (
                    <li
                      key={message.localId}
                      className={`${styles.message} ${message.direction === 'incoming' ? styles.incoming : styles.outgoing}`}
                    >
                      <div className={styles.content}>
                        <p className={styles.text}>{message.text}</p>
                        <p className={styles.meta}>
                          <span>{directionLabel}</span>
                          {statusText ? <span>{statusText}</span> : null}
                          <time dateTime={new Date(message.sentAt).toISOString()}>
                            {formatMessageTime(message.sentAt)}
                          </time>
                        </p>
                        {message.direction === 'outgoing' && message.status === 'failed' ? (
                          <RetrySendButton localId={message.localId} />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          <SendMessageForm key={selectedChat.chatId} chatId={selectedChat.chatId} />
        </>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Выберите или создайте чат</p>
          <p className={styles.emptyHint}>Новый чат открывается по номеру телефона.</p>
        </div>
      )}
    </section>
  );
};
