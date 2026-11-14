import './styles.css';
import { balance, content } from './content';
import { dispatch, newGame, type Action } from './engine/state';
import type { GameState } from './engine/types';
import { cuesFor } from './ui/cues';
import { mountDossier } from './ui/dossier';
import { cancelPeek, schedulePeek } from './ui/peek';
import { showLoading } from './ui/loading';
import { mountDialog, mountHelp, restartHtml } from './ui/help';
import { noticeDialogHtml, showNotice } from './ui/notice';
import { reducedMotion, runScene } from './ui/scene';
import { introScene, sceneFor } from './ui/transitions';
import { showTitle } from './ui/title';
import { renderScreen, type View } from './ui/render';
import { loadGame, saveGame } from './ui/save';
import { play, setSound, soundOn } from './ui/sound';
import { eventsFor, setTracking, track } from './ui/track';
import { mountDrag } from './ui/drag';

const rng = Math.random;
let state: GameState = loadGame(content, balance) ?? newGame(content, balance, rng);
// Developer mode (the numbers behind every card) is only for those who know the address: ?fejleszto
const view: View = { dev: new URLSearchParams(window.location.search).has('fejleszto') };
// Now and then the captain peeks in; ?kukucs makes him come at once on every sheet (for testing).
const eagerPeek = new URLSearchParams(window.location.search).has('kukucs');
// The developer's own games are not counted.
setTracking(!view.dev);
let lastKey = '';
/**
 * Set while something covers the game (the title card, the loading screen, a scene between
 * screens); the game is not rendered until it is gone. Calling it removes the cover at once.
 */
let cancelLoading: (() => void) | null = null;

const app = document.getElementById('app')!;

function render(): void {
  if (cancelLoading) { cancelPeek(); return; }
  const key = `${state.screen}:${state.week}`;
  const active = document.activeElement as HTMLElement | null;
  const keepFocus = key === lastKey && active?.dataset?.action && active.dataset.id
    ? `[data-action="${active.dataset.action}"][data-id="${active.dataset.id}"]`
    : null;

  app.innerHTML = renderScreen(state, content, balance, view);
  if (state.screen === 'ending') void mountDossier(app, state, content, balance);
  // A new sheet may get a visit; staying on the same sheet keeps the one planned.
  if (key !== lastKey) schedulePeek(state, content, rng, eagerPeek);

  if (key !== lastKey) {
    window.scrollTo(0, 0);
    document.getElementById('t')?.focus({ preventScroll: true });
    lastKey = key;
  } else if (keepFocus) {
    app.querySelector<HTMLElement>(keepFocus)?.focus({ preventScroll: true });
  }
}

function toAction(el: HTMLElement): Action | null {
  const { action, id, slot, part, idx } = el.dataset;
  switch (action) {
    case 'reroll': case 'start': case 'submit': case 'next': case 'restart':
      return { type: action };
    case 'toggleObs': case 'toggleInt':
      return id ? { type: action, id } : null;
    case 'strike':
      return idx !== undefined ? { type: 'strike', idx: Number(idx) } : null;
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
  if (a) act(a);
});
// Slips and report parts can also be dragged onto a chosen sentence.
mountDrag(app, act);

/** Applies an action: the new state, saved, counted, its sounds, and a scene if it leads to one. */
function act(a: Action): void {
  const before = state;
  state = dispatch(state, a, content, balance, rng);
  saveGame(state);
  for (const ev of eventsFor(a, before, state, content, balance)) track(ev);
  const cues = cuesFor(a, before, state);
  // Without the stamp animation the stamp is down at once, and so is its sound.
  const still = reducedMotion();
  const sound = (skipPage: boolean) => {
    for (const x of cues) if (!(skipPage && x.cue === 'page')) play(x.cue, x.cue === 'stamp' && still ? 0 : x.at);
  };
  // A new week or a quarterly review comes with a short scene; the new sheet appears after it.
  const scene = sceneFor(a, before, state, content, still);
  if (!scene) { render(); sound(false); return; }
  cancelLoading = runScene(scene, content.transitions.skip, () => { cancelLoading = null; render(); sound(true); });
}

/** A new game opens with the captain taking the file off the shelf; a saved one goes straight on. */
function openGame(): void {
  if (state.screen !== 'intro') { render(); return; }
  cancelLoading = runScene(introScene(state, content, reducedMotion()), content.transitions.skip, () => {
    cancelLoading = null;
    render();
  });
}

// The boxed „?” in the top left corner opens the manual, the „!” next to it the notice on what the game is.
mountHelp(document.getElementById('helpBtn') as HTMLButtonElement, document.getElementById('help') as HTMLDialogElement,
  content.help, () => { play('page'); track('sugo'); });
mountDialog(document.getElementById('noticeBtn') as HTMLButtonElement, document.getElementById('notice') as HTMLDialogElement,
  noticeDialogHtml(content.loading.notice, content.help.close), 'notice-d', content.loading.notice.button, () => play('page'));

// The boxed „♪” switches the sound; it shows whether it is on.
const soundBtn = document.getElementById('soundBtn') as HTMLButtonElement;
const showSound = () => {
  soundBtn.setAttribute('aria-pressed', String(soundOn()));
  soundBtn.setAttribute('aria-label', content.corner.sound);
  soundBtn.title = soundOn() ? content.corner.soundOn : content.corner.soundOff;
};
showSound();
soundBtn.addEventListener('click', () => {
  setSound(!soundOn());
  showSound();
  if (soundOn()) play('key');
});

// The version, always in sight beside the corner keys.
const versionEl = document.getElementById('version')!;
versionEl.textContent = `v${__APP_VERSION__}`;
versionEl.title = `Verzió: ${__APP_VERSION__}`;

// The boxed „↺” starts a new game, but asks first.
const restartDialog = document.getElementById('restart') as HTMLDialogElement;
mountDialog(document.getElementById('restartBtn') as HTMLButtonElement, restartDialog,
  restartHtml(content.corner.restart), 'restart-t', content.corner.restart.button, () => play('page'));
restartDialog.addEventListener('close', () => {
  if (restartDialog.returnValue !== 'yes') return;
  restartDialog.returnValue = '';
  cancelLoading?.();
  cancelLoading = null;
  document.body.classList.remove('loading-screen');
  state = newGame(content, balance, rng);
  saveGame(state);
  track('uj-jatek');
  lastKey = '';
  play('page');
  openGame();
});

/** The loading screen shows the desk in focus (see body.loading-screen in styles.css). */
function startLoading(): void {
  document.body.classList.add('loading-screen');
  cancelLoading = showLoading(app, content.loading, rng, () => {
    cancelLoading = null;
    play('page');
    document.body.classList.remove('loading-screen');
    openGame();
  });
}

/** Before the archive: what the game is and is not. The game goes on only once it is acknowledged. */
function startNotice(): void {
  document.body.classList.add('loading-screen');
  cancelLoading = showNotice(app, content.loading.notice, () => { play('page'); startLoading(); });
}

// First the title on a black screen, as a quote; then the notice; then the file is fetched from
// the archive. Until the game starts, `cancelLoading` removes whichever of them is up.
document.body.classList.add('loading-screen');
cancelLoading = showTitle(content.loading.card, startNotice);
