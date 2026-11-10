import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { validateContent } from '../content/validate';
import { helpHtml } from './help';
import { noticeDialogHtml, noticeHtml } from './notice';

describe('the help', () => {
  it('explains every part of the game, with a way to close it', () => {
    const html = helpHtml(content.help);
    for (const s of content.help.sections) expect(html).toContain(`<h2>${s.title}</h2>`);
    expect(html).toContain('method="dialog"');
    expect(html.match(/value="close"/g)).toHaveLength(2);
  });

  it('comes with the notice on what the game is, the same text on its screen and in its dialog', () => {
    const n = content.loading.notice;
    const memo = noticeHtml(n, 'x');
    for (const p of n.text) expect(memo).toContain(p);
    expect(noticeDialogHtml(n, content.help.close)).toContain(noticeHtml(n, 'notice-d'));
    expect(n.ack).toBeTruthy();
  });

  it('never gives a secret away: the validator catches numbers, endings and story secrets', () => {
    const spoil = (text: string) => {
      const c = structuredClone(content);
      c.help.sections[0].text.push(text);
      return validateContent(c, balance).filter(e => e.startsWith('Súgó'));
    };
    expect(spoil('Ártatlan mondat.')).toEqual([]);
    expect(spoil('Négy pont ártalom után 4 lépcső jön.')).not.toEqual([]);
    expect(spoil(`A legjobb vég: ${content.endings.kivalo.title}.`)).not.toEqual([]);
    expect(spoil('A néni kávéja Bécsből jön.')).not.toEqual([]);
  });
});
