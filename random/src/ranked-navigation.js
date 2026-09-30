// Transfer only display preferences across origins, never credentials.
export function rankedLink(base, theme, language) {
  const url = new URL(base);
  url.hash = 'ranked&' + new URLSearchParams({
    theme: theme === 'light' ? 'light' : 'dark',
    language: language === 'en' ? 'en' : 'ko'
  });
  return url.href;
}

export function rankedEntry(hash) {
  const [mode, ...parts] = hash.replace(/^#/, '').split('&');
  const params = new URLSearchParams(parts.join('&'));
  return {
    ranked: mode === 'ranked',
    theme: mode === 'ranked' && ['dark', 'light'].includes(params.get('theme')) ? params.get('theme') : null,
    language: mode === 'ranked' && ['ko', 'en'].includes(params.get('language')) ? params.get('language') : null
  };
}

export async function restoreRankedSession({ getUser, onUser, onUnauthorized, onError, shouldPrompt }) {
  try { onUser(await getUser()); }
  catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      onUnauthorized(shouldPrompt());
    } else onError(error);
  }
}
