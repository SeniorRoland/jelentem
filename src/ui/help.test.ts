import { describe, expect, it } from 'vitest';
import { balance, content } from '../content';
import { validateContent } from '../content/validate';
import { helpHtml } from './help';

describe('the help', () => {
  it('explains every part of the game, with a way to close it', () => {
    const html = helpHtml(content.help);
    for (const s of content.help.sections) expect(html).toContain(`<h2>${s.title}</h2>`);
    expect(html).toContain('method="dialog"');
    expect(html.match(/value="close"/g)).toHaveLength(2);
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
