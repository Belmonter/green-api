import { useLayoutEffect, useRef } from 'react';

import type { UseStickToBottomInputType } from './useStickToBottom.types';

/** Distance from the end that still counts as the latest messages. */
const MESSAGE_LIST_BOTTOM_GAP_PX = 48;

/** Follows the end only while the reader is already there. */
export const useStickToBottom = ({ chatId, messages, hidden }: UseStickToBottomInputType) => {
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const chatRef = useRef(chatId);

  if (chatRef.current !== chatId) {
    chatRef.current = chatId;
    stickRef.current = true;
  }

  useLayoutEffect(() => {
    const list = listRef.current;

    if (!list || hidden || !stickRef.current) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, [chatId, hidden, messages]);

  const onScroll = () => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    stickRef.current = list.scrollHeight - list.scrollTop - list.clientHeight <= MESSAGE_LIST_BOTTOM_GAP_PX;
  };

  return { listRef, onScroll };
};
