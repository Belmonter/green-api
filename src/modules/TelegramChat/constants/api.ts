/** Count passed to `getChatHistory`. */
export const CHAT_HISTORY_COUNT = 100;

/** Max `sendMessage` length. */
export const MAX_MESSAGE_LENGTH = 4096;

/** Allowed `getStateInstance` values. */
export const INSTANCE_STATES = [
  'authorized',
  'notAuthorized',
  'blocked',
  'suspended',
  'starting',
  'pendingPassword',
] as const;

/** Text `typeMessage` values the messenger shows. */
export const TEXT_MESSAGE_TYPE = {
  /** Plain text. */
  plain: 'textMessage',
  /** Text with a link preview. */
  extended: 'extendedTextMessage',
} as const;

/** Min digits in an international number, without a leading zero. */
export const PHONE_NUMBER_MIN_DIGITS = 8;

/** Max digits in an international number, without a leading zero. */
export const PHONE_NUMBER_MAX_DIGITS = 15;

/** Max phone field length before separators are stripped. */
export const PHONE_INPUT_MAX_LENGTH = 64;

/** Numeric instance id. */
export const INSTANCE_ID_PATTERN = /^[1-9]\d{0,14}$/;

/** Instance token shape. */
export const API_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,256}$/;

/** Personal chat id. Digits only. */
export const CHAT_ID_PATTERN = /^\d{1,32}$/;

/** International number: digits, no leading plus or zero. */
export const PHONE_NUMBER_PATTERN = new RegExp(
  `^[1-9]\\d{${PHONE_NUMBER_MIN_DIGITS - 1},${PHONE_NUMBER_MAX_DIGITS - 1}}$`,
);

/** GREEN-API origin. */
export const GREEN_API_ORIGIN_PATTERN = /^https:\/\/(?:\d+\.)?api\.green-api\.com$/;

/** GREEN-API origin, or null when the host is not allowed. */
export const greenApiOrigin = (apiUrl: unknown): string | null => {
  if (typeof apiUrl !== 'string') {
    return null;
  }

  let url: URL;

  try {
    url = new URL(apiUrl.trim());
  } catch {
    return null;
  }

  const hasExtraParts =
    url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '' || url.pathname !== '/';

  if (hasExtraParts || !GREEN_API_ORIGIN_PATTERN.test(url.origin)) {
    return null;
  }

  return url.origin;
};
