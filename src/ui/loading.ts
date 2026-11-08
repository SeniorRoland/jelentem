import { LOADING_STEPS } from '../content/validate';
import { shuffle } from '../engine/rng';
import type { LoadingContent, Rng } from '../engine/types';
import { bar } from './render';

export type LoadEntry = { text: string; pct: number; kind: 'step' | 'setback' | 'over' };

/**
 * The bureaucratic loading sequence: a few steps with rising progress, one setback that
 * pushes the progress back, then plan overfulfilment. Pure, all randomness comes from `rng`.
 */
export function planLoading(l: LoadingContent, rng: Rng, n = LOADING_STEPS): LoadEntry[] {
  const steps = shuffle(l.steps, rng).slice(0, n);
  const w = steps.map(() => 0.5 + rng());
  const total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  const out: LoadEntry[] = steps.map((text, i) => {
    acc += w[i];
    return { text, pct: i === n - 1 ? 100 : Math.round((acc / total) * 100), kind: 'step' };
  });
  // The setback comes after a step in the middle, and loses 15–30 percentage points.
  const at = 1 + Math.floor(rng() * (n - 2));
  const back = Math.max(0, out[at].pct - (15 + Math.floor(rng() * 16)));
  out.splice(at + 1, 0, { text: shuffle(l.setbacks, rng)[0], pct: back, kind: 'setback' });
  out.push({ text: l.overfulfil, pct: 112, kind: 'over' });
  return out;
}

const DELAY: Record<LoadEntry['kind'], number> = { step: 650, setback: 1300, over: 700 };

/**
 * Shows the loading screen in `root` and calls `onDone` when the player opens the file
 * (or skips the queue). Only the stamp moves; the steps just change text.
 * Returns a function that cancels the screen.
 */
export function showLoading(root: HTMLElement, l: LoadingContent, rng: Rng, onDone: () => void): () => void {
  const plan = planLoading(l, rng);
  const serial = 100 + Math.floor(rng() * 900);
  root.innerHTML = `<article class="sheet loading" aria-busy="true">
  <div class="letterhead"><div>Belügyminisztérium III/III. Csoportfőnökség<br>${l.office}<br>Kikérő lap: ${serial}/1979</div><div class="secret">SZIGORÚAN TITKOS!</div></div>
  <h1 id="t" tabindex="-1">${l.title}</h1>
  <p class="lede">${l.lede}</p>
  <p class="loading-status" role="status" aria-live="polite"></p>
  <p class="loading-bar"><span class="bar" role="progressbar" aria-label="Betöltés" aria-valuemin="0" aria-valuemax="100"></span> <span class="loading-pct" aria-hidden="true"></span></p>
  <ol class="loading-log"></ol>
  <div class="actions"><button class="btn quiet" data-loading="skip">${l.skip}</button></div>
  </article>`;

  const sheet = root.querySelector<HTMLElement>('.loading')!;
  const status = sheet.querySelector<HTMLElement>('.loading-status')!;
  const meter = sheet.querySelector<HTMLElement>('.bar')!;
  const pct = sheet.querySelector<HTMLElement>('.loading-pct')!;
  const log = sheet.querySelector<HTMLElement>('.loading-log')!;
  const actions = sheet.querySelector<HTMLElement>('.actions')!;
  let timer = 0;
  let over = false;

  const finish = () => {
    if (over) return;
    over = true;
    window.clearTimeout(timer);
    onDone();
  };
  const cancel = () => { over = true; window.clearTimeout(timer); };

  const logLine = (e: LoadEntry) => {
    const li = document.createElement('li');
    li.className = e.kind;
    li.textContent = `${e.text} – ${e.kind === 'setback' ? l.setbackDone : l.done}`;
    log.appendChild(li);
  };

  const show = (i: number) => {
    if (over) return;
    if (i > 0 && plan[i - 1].kind !== 'over') logLine(plan[i - 1]);
    if (i === plan.length) return stamp();
    const e = plan[i];
    status.textContent = e.kind === 'over' ? e.text : `${e.text}…`;
    meter.textContent = bar(Math.min(100, e.pct));
    meter.setAttribute('aria-valuenow', String(Math.min(100, e.pct)));
    pct.textContent = `${e.pct}%`;
    sheet.classList.toggle('setback', e.kind === 'setback');
    timer = window.setTimeout(() => show(i + 1), DELAY[e.kind]);
  };

  // The stamp waits for the fonts, so the game never opens in a fallback typeface.
  const stamp = async () => {
    const fonts = document.fonts?.ready ?? Promise.resolve();
    await Promise.race([fonts, new Promise(r => window.setTimeout(r, 2500))]);
    if (over) return;
    sheet.setAttribute('aria-busy', 'false');
    sheet.insertAdjacentHTML('beforeend', `<div class="stamp" aria-hidden="true">${l.stamp}</div>`);
    status.textContent = `${l.stamp}.`;
    actions.innerHTML = `<button class="btn" data-loading="enter">${l.enter}</button>`;
    actions.querySelector<HTMLElement>('button')!.focus();
  };

  sheet.addEventListener('click', e => {
    if ((e.target as HTMLElement).closest('[data-loading]')) finish();
  });

  sheet.querySelector<HTMLElement>('#t')!.focus({ preventScroll: true });
  show(0);
  return cancel;
}
