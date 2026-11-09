/** Portrait URLs by face id (`src/assets/faces/<id>.jpg`), resolved and hashed by Vite. */
const files = import.meta.glob('../assets/faces/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const FACE_URL: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace(/^.*\/([^/]+)\.jpg$/, '$1'), url]),
);

/** A small portrait; `alt` names the person, or empty when the name stands right next to it. */
export const faceImg = (id: string | undefined, alt: string, cls = 'face'): string =>
  id && FACE_URL[id] ? `<img class="${cls}" src="${FACE_URL[id]}" alt="${alt}" width="120" height="160" loading="lazy" decoding="async">` : '';
