import type { HelpContent } from '../engine/types';

/** The help text as HTML: a short manual of how the game works, with no secret given away. Pure. */
export function helpHtml(h: HelpContent): string {
  return `<form method="dialog" class="help-sheet">
  <button class="help-x" value="close" aria-label="${h.close}">×</button>
  <h1 id="help-t">${h.title}</h1>
  <p class="lede">${h.lede}</p>
  ${h.sections.map(s => `<h2>${s.title}</h2>${s.text.map(p => `<p>${p}</p>`).join('')}`).join('\n  ')}
  <div class="actions"><button class="btn" value="close">${h.close}</button></div>
  </form>`;
}

/**
 * Wires one of the boxed buttons in the top left corner to its dialog. The native `<dialog>`
 * keeps the focus inside and closes with Escape; a click on the dim backdrop closes it too.
 * `onOpen` lets the caller add a sound.
 */
export function mountDialog(button: HTMLButtonElement, dialog: HTMLDialogElement, html: string, titleId: string, label: string, onOpen: () => void = () => {}): void {
  dialog.innerHTML = html;
  dialog.setAttribute('aria-labelledby', titleId);
  button.setAttribute('aria-label', label);
  button.title = label;
  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    dialog.scrollTop = 0;
    onOpen();
  };
  button.addEventListener('click', open);
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => button.focus({ preventScroll: true }));
}

/** The „?” in the top left corner opens the manual. */
export const mountHelp = (button: HTMLButtonElement, dialog: HTMLDialogElement, h: HelpContent, onOpen?: () => void): void =>
  mountDialog(button, dialog, helpHtml(h), 'help-t', h.button, onOpen);
