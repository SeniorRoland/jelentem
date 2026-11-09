import { dossierText, makeDossier, type Dossier } from '../engine/dossier';
import type { Balance, Content, GameState } from '../engine/types';
import { FACE_URL } from './faces';

/** The shared image: portrait, so it fits a phone screen and social media alike. */
const W = 1080, H = 1350, M = 80;
const TYPED = '"Courier Prime", "Courier New", monospace';
const PRINTED = 'Arial, Helvetica, "Liberation Sans", sans-serif';
const HAND = 'Caveat, cursive';

/** Colours of the file, the same in both themes (see `--akta-*` in styles.css). */
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    paper: v('--akta-paper', '#ecdfae'), edge: v('--akta-edge', '#c7ad6e'), stain: v('--akta-stain', 'rgba(150,104,30,.13)'),
    label: v('--akta-label', '#1f1c17'), typed: v('--akta-typed', '#3b3832'), stamp: v('--akta-stamp', '#b0261c'),
    pen: v('--akta-pen', '#1d4ea3'), bar: v('--akta-bar', '#111'), dots: v('--akta-dots', '#5b5345'),
  };
}

/** The public address of the game, when it has one (never localhost). */
export function publicUrl(): string {
  const { protocol, hostname, origin, pathname } = window.location;
  return /^https?:$/.test(protocol) && !/^(localhost|127\.|\[::1\])/.test(hostname) && !hostname.endsWith('.localhost')
    ? origin + pathname : '';
}

/** Splits text into lines that fit `width` with the current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  // Only ordinary spaces break a line; a non-breaking space keeps „V. szds.” together.
  for (const word of text.split(/ +/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const loadImage = (src: string) => new Promise<HTMLImageElement | null>(res => {
  if (!src) return res(null);
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => res(null);
  img.src = src;
});

/** Draws the player's file: letterhead, photo, typed fields, the sentence of the year with the captain's note, the stamp. */
export async function drawDossier(d: Dossier, c: Content, sig: string): Promise<HTMLCanvasElement> {
  const t = c.dossier;
  const p = palette();
  // The canvas only uses web fonts that are already loaded.
  await Promise.race([
    Promise.all([`700 40px "Courier Prime"`, `italic 40px "Courier Prime"`, `600 40px Caveat`].map(f => document.fonts?.load(f))),
    new Promise(r => setTimeout(r, 2500)),
  ]).catch(() => undefined);

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;

  // Yellowed card with darker edges and two old coffee rings.
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, W, H);
  const edge = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.85);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, p.edge);
  ctx.fillStyle = edge;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p.stain;
  for (const [x, y, r] of [[880, 1180, 95], [170, 520, 60]] as const) {
    ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }

  // Letterhead and the „Szigorúan titkos!” box.
  ctx.fillStyle = p.label;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 22px ${PRINTED}`;
  ctx.fillText('BELÜGYMINISZTÉRIUM III/III. CSOPORTFŐNÖKSÉG', M, 110);
  ctx.font = `400 24px ${PRINTED}`;
  ctx.fillText(`Ügyszám: ${d.serial}/1979`, M, 146);
  ctx.save();
  ctx.translate(W - M - 150, 128); ctx.rotate(0.06);
  ctx.strokeStyle = p.stamp; ctx.fillStyle = p.stamp; ctx.lineWidth = 3;
  ctx.font = `700 26px ${TYPED}`;
  const secret = 'SZIGORÚAN TITKOS!';
  const sw = ctx.measureText(secret).width;
  ctx.strokeRect(-sw / 2 - 14, -30, sw + 28, 44); ctx.strokeRect(-sw / 2 - 8, -24, sw + 16, 32);
  ctx.textAlign = 'center'; ctx.fillText(secret, 0, 1);
  ctx.restore();

  ctx.fillStyle = p.label;
  ctx.font = `700 40px ${PRINTED}`;
  ctx.textAlign = 'left';
  ctx.fillText(t.heading.toUpperCase(), M, 250);

  // The photo, clipped to the card.
  const photo = await loadImage(FACE_URL[d.face] ?? '');
  const px = W - M - 230, py = 300, pw = 230, ph = 307;
  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(0.03);
  ctx.fillStyle = '#fff'; ctx.fillRect(-pw / 2 - 8, -ph / 2 - 8, pw + 16, ph + 16);
  if (photo) { ctx.filter = 'sepia(.35) contrast(1.05)'; ctx.drawImage(photo, -pw / 2, -ph / 2, pw, ph); ctx.filter = 'none'; }
  ctx.fillStyle = '#8b8b8b'; ctx.fillRect(-30, -ph / 2 - 26, 60, 34);   // the staple strip
  ctx.restore();

  // Typed fields on dotted lines.
  const field = (label: string, value: string, y: number, width = px - M - 40, redacted = false) => {
    ctx.font = `700 24px ${PRINTED}`; ctx.fillStyle = p.label;
    ctx.fillText(`${label}:`, M, y);
    const lx = M + ctx.measureText(`${label}:`).width + 14;
    ctx.strokeStyle = p.dots; ctx.setLineDash([2, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, y + 6); ctx.lineTo(M + width, y + 6); ctx.stroke(); ctx.setLineDash([]);
    if (redacted) { ctx.fillStyle = p.bar; ctx.fillRect(lx + 6, y - 30, Math.min(300, M + width - lx - 10), 40); return; }
    ctx.font = `700 32px ${TYPED}`; ctx.fillStyle = p.typed;
    let v = value;
    while (ctx.measureText(v).width > M + width - lx - 10 && v.length > 4) v = v.slice(0, -2) + '…';
    ctx.fillText(v, lx + 6, y - 2);
  };
  field(t.code, d.code, 350);
  field(t.realName, '', 420, undefined, true);
  field(t.rank, d.rank, 490);
  field(t.weeks, `${d.weeks} hét, ${d.sentences} mondat`, 560);
  field(t.onYouLabel, `${d.reportsOnYou}`, 630);
  field(t.trusted, `${d.trusted}`, 700, W - 2 * M);

  // The sentence of the year, typed, with the captain's note in blue ink.
  let y = 800;
  ctx.font = `700 24px ${PRINTED}`; ctx.fillStyle = p.label;
  ctx.fillText(`${t.best.toUpperCase()}${d.best ? ` (${d.best.week}. HÉT)` : ''}`, M, y);
  y += 48;
  ctx.font = `italic 30px ${TYPED}`; ctx.fillStyle = p.typed;
  const quote = d.best ? `„${d.best.text}”` : '„Jelentem, a megfigyelt időszakban nem történt semmi.”';
  const qLines = wrap(ctx, quote, W - 2 * M).slice(0, 6);
  for (const l of qLines) { ctx.fillText(l, M, y); y += 40; }
  if (d.best?.note) {
    ctx.save();
    ctx.translate(M + 20, y + 30); ctx.rotate(-0.025);
    ctx.font = `600 42px ${HAND}`; ctx.fillStyle = p.pen;
    const nLines = wrap(ctx, `${d.best.note} – ${sig.replace(/ /g, ' ')}`, W - 2 * M - 60).slice(0, 3);
    nLines.forEach((l, i) => ctx.fillText(l, 0, i * 46));
    ctx.restore();
    y += 30 + nLines.length * 46;
  }

  // Who got hurt.
  y = Math.max(y + 40, 1070);
  ctx.font = `700 24px ${PRINTED}`; ctx.fillStyle = p.label;
  ctx.fillText(`${t.harmed.toUpperCase()}:`, M, y);
  ctx.font = `700 26px ${TYPED}`; ctx.fillStyle = p.typed;
  const harmed = d.harmed.length ? d.harmed : [t.noneHarmed];
  harmed.slice(0, 3).forEach((h, i) => ctx.fillText(wrap(ctx, h, W - 2 * M)[0], M, y + 40 + i * 34));

  // The verdict, stamped across the card.
  ctx.save();
  // On the right, over the photo's corner where the fields have no values; never over the sentence of the year.
  ctx.translate(W - M - 290, 665); ctx.rotate(-0.17);
  ctx.globalAlpha = 0.78; ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = p.stamp; ctx.fillStyle = p.stamp; ctx.lineWidth = 6;
  ctx.font = `700 64px ${TYPED}`; ctx.textAlign = 'center';
  const stamp = d.ending.toUpperCase();
  let size = 64;
  while (ctx.measureText(stamp).width > 560 && size > 30) { size -= 4; ctx.font = `700 ${size}px ${TYPED}`; }
  const w = ctx.measureText(stamp).width;
  ctx.strokeRect(-w / 2 - 28, -size - 6, w + 56, size + 40);
  ctx.fillText(stamp, 0, 8);
  ctx.restore();

  // Footer.
  ctx.font = `400 22px ${PRINTED}`; ctx.fillStyle = p.label; ctx.textAlign = 'center';
  const url = publicUrl();
  ctx.fillText(t.footer, W / 2, H - 70);
  if (url) ctx.fillText(url, W / 2, H - 40);
  return cv;
}

/** Copies text: the Clipboard API where allowed, otherwise the old select-and-copy way. */
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* blocked: try the old way */ }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(area);
  area.select();
  try { return document.execCommand('copy'); } catch { return false; } finally { area.remove(); }
}

const toBlob = (cv: HTMLCanvasElement) => new Promise<Blob | null>(res => cv.toBlob(res, 'image/png'));

/** A safe file name from the code name: „Kockás Abrosz” → „akta-kockas-abrosz.png”. */
export const fileName = (prefix: string, code: string): string =>
  `${prefix}-${code.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`;

/**
 * Fills the ending screen's file section: draws the image as a preview and wires the
 * download, share and copy buttons. Called after every render of the ending screen.
 */
export async function mountDossier(root: HTMLElement, s: GameState, c: Content, b: Balance): Promise<void> {
  const box = root.querySelector<HTMLElement>('.dossier');
  if (!box) return;
  const d = makeDossier(s, c, b);
  const text = dossierText(d, c, publicUrl());
  const status = box.querySelector<HTMLElement>('.dossier-status')!;
  const say = (msg: string) => { status.textContent = msg; };
  const canvas = drawDossier(d, c, `${s.captain.name[0]}. szds.`);
  const name = fileName(c.dossier.file, d.code);

  canvas.then(cv => {
    const img = box.querySelector<HTMLImageElement>('.dossier-preview');
    if (img) { img.src = cv.toDataURL('image/png'); img.hidden = false; }
  }).catch(() => undefined);

  const shareBtn = box.querySelector<HTMLButtonElement>('[data-dossier="share"]');
  if (shareBtn && !navigator.share) shareBtn.hidden = true;

  box.addEventListener('click', async e => {
    const kind = (e.target as HTMLElement).closest<HTMLElement>('[data-dossier]')?.dataset.dossier;
    if (!kind) return;
    try {
      if (kind === 'copy') return say(await copyText(text) ? c.dossier.copied : c.dossier.failed);
      const blob = await toBlob(await canvas);
      if (!blob) return say(c.dossier.failed);
      if (kind === 'share') {
        const file = new File([blob], name, { type: 'image/png' });
        const data: ShareData = navigator.canShare?.({ files: [file] }) ? { files: [file], text } : { text };
        await navigator.share(data);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      // A cancelled share sheet is not an error worth reporting.
      if ((err as Error)?.name !== 'AbortError') say(c.dossier.failed);
    }
  });
}
