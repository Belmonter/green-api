/** Joins ids for `aria-describedby`. Empty stays unset. */
export const joinDescribedBy = (ids: Array<string | false | null | undefined>): string | undefined => {
  const value = ids.filter((id): id is string => typeof id === 'string' && id.length > 0).join(' ');

  return value.length > 0 ? value : undefined;
};
