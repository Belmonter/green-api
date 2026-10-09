/** Focuses `element` when the current target is hidden or missing. */
export const focusIfObscured = (element: HTMLElement | null): void => {
  if (!element) {
    return;
  }

  const active = document.activeElement;
  const activeIsVisible =
    active instanceof HTMLElement &&
    active !== document.body &&
    active !== document.documentElement &&
    active.closest('[hidden]') === null;

  if (activeIsVisible) {
    return;
  }

  element.focus();
};
