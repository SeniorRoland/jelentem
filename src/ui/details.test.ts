import { describe, expect, it } from 'vitest';
import { content } from '../content';
import { DETAIL_URL, detailPhoto } from './details';

describe('desk-photo details', () => {
  const photos = [...content.career.ranks.map(r => r.photo), ...Object.values(content.endings).map(e => e.photo)].filter(Boolean);

  it('have a file for every photo the content names', () => {
    expect(photos.length).toBeGreaterThan(0);
    for (const p of photos) expect(DETAIL_URL[p!.id], p!.id).toBeTruthy();
  });

  it('clip the photo with its caption, and draw nothing without one', () => {
    const p = photos[0]!;
    const html = detailPhoto(p);
    expect(html).toContain('class="cpt-photo detail-photo"');
    expect(html).toContain(`<figcaption>${p.caption}</figcaption>`);
    expect(html).toContain('alt=""');
    expect(detailPhoto(undefined)).toBe('');
    expect(detailPhoto({ id: 'nincs-ilyen', caption: 'x' })).toBe('');
  });
});
