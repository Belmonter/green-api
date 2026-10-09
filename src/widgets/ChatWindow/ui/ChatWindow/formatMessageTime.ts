const messageTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

/** Hours and minutes of a stored message. */
export const formatMessageTime = (sentAt: number): string => {
  return messageTimeFormat.format(sentAt);
};
