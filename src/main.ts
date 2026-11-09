import './styles.css';
import { balance, content } from './content';
import { dispatch, newGame, type Action } from './engine/state';
import type { GameState } from './engine/types';
import { cuesFor } from './ui/cues';
import { showLoading } from './ui/loading';
import { showTitle } from './ui/title';
import { renderScreen, type View } from './ui/render';
import { loadGame, saveGame } from './ui/save';
import { play, setSound, soundOn } from './ui/sound';

const rng = Math.random;
let state: GameState = loadGame(content, balance) ?? newGame(content, balance, rng);
const view: View = { dev: false };
let lastKey = '';
/** Set while the loading screen is up; the game is not rendered until it is gone. */
let cancelLoading: (() => void) | null = null;

const app = document.getElementById('app')!;

function render(): void {
  if (cancelLoading) return;
  const key = `${state.screen}:${state.week}`;
  const active = document.activeElement as HTMLElement | null;
  const keepFocus = key === lastKey && active?.dataset?.action && active.dataset.id
    ? `[data-action="${active.dataset.action}"][data-id="${active.dataset.id}"]`
    : null;

  app.innerHTML = renderScreen(state, content, balance, view);

  if (key !== lastKey) {
    window.scrollTo(0, 0);
    document.getElementById('t')?.focus({ preventScroll: true });
    lastKey = key;
  } else if (keepFocus) {
    app.querySelector<HTMLElement>(keepFocus)?.focus({ preventScroll: true });
  }
}

function toAction(el: HTMLElement): Action | null {
  const { action, id, slot, part } = el.dataset;
  switch (action) {
    case 'reroll': case 'start': case 'submit': case 'next': case 'restart':
      return { type: action };
    case 'toggleObs': case 'toggleInt':
      return id ? { type: action, id } : null;
    case 'unplace':
      return slot !== undefined && (part === 'o' || part === 'i') ? { type: 'unplace', slot: Number(slot), part } : null;
    default:
      return null;
  }
}

app.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!el) return;
  const a = toAction(el);
  if (!a) return;
  const before = state;
  state = dispatch(state, a, content, balance, rng);
  saveGame(state);
  render();
  // Without the stamp animation the stamp is down at once, and so is its sound.
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  for (const x of cuesFor(a, before, state)) play(x.cue, x.cue === 'stamp' && still ? 0 : x.at);
});

const soundToggle = document.getElementById('soundToggle') as HTMLInputElement;
soundToggle.checked = soundOn();
soundToggle.addEventListener('change', () => {
  setSound(soundToggle.checked);
  if (soundToggle.checked) play('key');
});

document.getElementById('devToggle')!.addEventListener('change', e => {
  view.dev = (e.target as HTMLInputElement).checked;
  render();
});

document.getElementById('restartBtn')!.addEventListener('click', () => {
  cancelLoading?.();
  cancelLoading = null;
  document.body.classList.remove('loading-screen');
  state = newGame(content, balance, rng);
  saveGame(state);
  lastKey = '';
  render();
  play('page');
});

/** The loading screen shows the desk in focus (see body.loading-screen in styles.css). */
function startLoading(): void {
  document.body.classList.add('loading-screen');
  cancelLoading = showLoading(app, content.loading, rng, () => {
    cancelLoading = null;
    play('page');
    document.body.classList.remove('loading-screen');
    render();
  });
}

// First the title on a black screen, as a quote; then the file is fetched from the archive.
// Until the loading screen starts, `cancelLoading` removes the title card instead.
document.body.classList.add('loading-screen');
cancelLoading = showTitle(content.loading.card, startLoading);
