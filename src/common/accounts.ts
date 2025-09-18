/**
 * some users don't follow the import guidelines, so their username
 * doesn't end with one of the suffixes. So we have to hardcode their
 * usernames.
 *
 * TODO: not sure if hardcoding usernames in this somewhat-public place
 * is allowed under GDPR??? hardcoding the numeric userid wouldn't be
 * much better… See https://osm.wiki/File:GDPR_Position_Paper.pdf
 */
const UNDECLARED_ACCOUNTS = new Set(['catgirlseraid']);

export const isImportUser = (username: string | undefined) =>
  username?.endsWith('_import') ||
  username?.endsWith('_linz') ||
  (username && UNDECLARED_ACCOUNTS.has(username));
