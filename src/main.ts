import './styles.css';
import { balance, content } from './content';
import { dispatch, newGame, type Action } from './engine/state';
import type { GameState } from './engine/types';
import { showLoading } from './ui/loading';
import { renderScreen, type View } from './ui/render';
import { loadGame, saveGame } from './ui/save';

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
  state = dispatch(state, a, content, balance, rng);
  saveGame(state);
  render();
});

document.getElementById('devToggle')!.addEventListener('change', e => {
  view.dev = (e.target as HTMLInputElement).checked;
  render();
});

document.getElementById('restartBtn')!.addEventListener('click', () => {
  cancelLoading?.();
  cancelLoading = null;
  state = newGame(content, balance, rng);
  saveGame(state);
  lastKey = '';
  render();
});

cancelLoading = showLoading(app, content.loading, rng, () => {
  cancelLoading = null;
  render();
});
