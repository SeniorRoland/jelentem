import type { Photo } from '../engine/types';

/**
 * Details cut out of the desk photo (`src/assets/details/<id>.jpg`), clipped to a sheet like the
 * captain's photo: the cigarettes of a reward, the telephone of a summons. Resolved by Vite.
 */
const files = import.meta.glob('../assets/details/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const DETAIL_URL: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace(/^.*\/([^/]+)\.jpg$/, '$1'), url]),
);

/** A clipped photo with a typed caption; nothing if the content names no photo or a missing one. */
export const detailPhoto = (p: Photo | undefined): string =>
  p && DETAIL_URL[p.id]
    ? `<figure class="cpt-photo detail-photo"><span class="cpt-clip" aria-hidden="true"></span><img src="${DETAIL_URL[p.id]}" alt="" decoding="async"><figcaption>${p.caption}</figcaption></figure>`
    : '';
