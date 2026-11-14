import type { LoadingContent } from '../engine/types';

type Notice = LoadingContent['notice'];

/** The notice on what the game is and is not, as a memo pinned to the file. Pure. */
export const noticeHtml = (n: Notice, titleId: string): string =>
  `<aside class="loading-notice" aria-labelledby="${titleId}"><h2 id="${titleId}">${n.title}</h2>${n.text.map(p => `<p>${p}</p>`).join('')}</aside>`;

/**
 * The screen between the title card and the loading screen: the notice, and a button to
 * acknowledge it. The game goes on only after the player has pressed it. Returns a function
 * that removes the screen without going on.
 */
export function showNotice(root: HTMLElement, n: Notice, onDone: () => void): () => void {
  root.innerHTML = `<article class="sheet notice-sheet">${noticeHtml(n, 'notice-t')}
  <div class="actions"><button class="btn" data-notice="ack">${n.ack}</button></div>
  </article>`;
  let over = false;
  const sheet = root.querySelector<HTMLElement>('.notice-sheet')!;
  sheet.querySelector<HTMLElement>('[data-notice]')!.addEventListener('click', () => {
    if (over) return;
    over = true;
    onDone();
  });
  window.scrollTo(0, 0);
  sheet.querySelector<HTMLElement>('[data-notice]')!.focus({ preventScroll: true });
  return () => { over = true; };
}

/** The same notice in a dialog, behind the „!” in the top left corner. Pure. */
export const noticeDialogHtml = (n: Notice, close: string): string =>
  `<form method="dialog" class="help-sheet">
  <button class="help-x" value="close" aria-label="${close}">×</button>
  ${noticeHtml(n, 'notice-d')}
  <p class="meta notice-privacy">${n.privacy}</p>
  <div class="actions"><button class="btn" value="close">${close}</button></div>
  </form>`;
