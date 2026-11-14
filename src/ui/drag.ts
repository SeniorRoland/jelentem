import type { Action } from '../engine/state';

/**
 * Drag and drop, on top of tapping (which stays the main way): a slip, or a part already in the
 * report, can be dragged onto a chosen sentence. Mouse and pen start as soon as they move; touch
 * starts after a long press, so swiping still scrolls the page. Near the top or bottom edge the
 * page scrolls, so a slip can travel down to the report on a phone.
 */

/** What is being dragged: an observation or an interpretation, by id. */
interface Drag { kind: 'o' | 'i'; id: string; ghost: HTMLElement; target: HTMLElement | null }

const MOVE = 6;          // px a mouse moves before it is a drag, not a click
const HOLD = 350;        // ms a finger rests before it is a drag, not a scroll
const EDGE = 70;         // px from the window edge where the page scrolls by itself

/** The drop the pointer is over: a sentence of the report and whether the part may go there. Pure on the DOM. */
export function dropAt(kind: 'o' | 'i', el: Element | null): { li: HTMLElement; slot: number; ok: boolean } | null {
  const li = el?.closest<HTMLElement>('li[data-slot]');
  if (!li) return null;
  const slot = Number(li.dataset.slot);
  // An interpretation needs an observation to go with.
  return { li, slot, ok: kind === 'o' || li.dataset.hasObs === 'true' };
}

export function mountDrag(root: HTMLElement, onDrop: (a: Action) => void): void {
  let drag: Drag | null = null;
  let pending: { e: PointerEvent; el: HTMLElement; timer: number } | null = null;
  let lastY = 0, raf = 0, quietUntil = 0;
  window.addEventListener('click', e => {
    if (performance.now() < quietUntil) { e.preventDefault(); e.stopPropagation(); quietUntil = 0; }
  }, true);

  const source = (t: EventTarget | null) => (t as HTMLElement | null)?.closest<HTMLElement>('[data-drag-kind][data-id]') ?? null;

  function begin(el: HTMLElement, x: number, y: number): void {
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = el.dataset.dragText ?? el.textContent ?? '';
    document.body.appendChild(ghost);
    drag = { kind: el.dataset.dragKind as 'o' | 'i', id: el.dataset.id!, ghost, target: null };
    document.body.classList.add('dragging');
    move(x, y);
    raf = requestAnimationFrame(edgeScroll);
  }

  function move(x: number, y: number): void {
    if (!drag) return;
    lastY = y;
    drag.ghost.style.transform = `translate(${x + 12}px, ${y + 12}px) rotate(-2deg)`;
    const hit = dropAt(drag.kind, document.elementFromPoint(x, y));
    if (drag.target !== hit?.li) {
      drag.target?.classList.remove('drop-target', 'drop-bad');
      drag.target = hit?.li ?? null;
    }
    hit?.li.classList.add(hit.ok ? 'drop-target' : 'drop-bad');
  }

  function edgeScroll(): void {
    if (!drag) return;
    const h = window.innerHeight;
    if (lastY < EDGE) window.scrollBy(0, -Math.ceil((EDGE - lastY) / 4));
    else if (lastY > h - EDGE) window.scrollBy(0, Math.ceil((lastY - (h - EDGE)) / 4));
    raf = requestAnimationFrame(edgeScroll);
  }

  function end(drop: boolean): void {
    if (pending) { clearTimeout(pending.timer); pending = null; }
    if (!drag) return;
    const d = drag;
    drag = null;
    cancelAnimationFrame(raf);
    d.ghost.remove();
    d.target?.classList.remove('drop-target', 'drop-bad');
    document.body.classList.remove('dragging');
    // The click that follows a drag (if the browser sends one) must not also toggle the slip.
    quietUntil = performance.now() + 400;
    if (!drop || !d.target) return;
    const slot = Number(d.target.dataset.slot);
    onDrop(d.kind === 'o' ? { type: 'placeObs', id: d.id, slot } : { type: 'placeInt', id: d.id, slot });
  }

  root.addEventListener('pointerdown', e => {
    const el = source(e.target);
    if (!el || e.button > 0) return;
    if (e.pointerType === 'touch') {
      pending = { e, el, timer: window.setTimeout(() => { if (pending) { const p = pending; pending = null; begin(p.el, p.e.clientX, p.e.clientY); } }, HOLD) };
    } else {
      pending = { e, el, timer: 0 };
    }
  });

  window.addEventListener('pointermove', e => {
    if (drag) { e.preventDefault(); move(e.clientX, e.clientY); return; }
    if (!pending) return;
    const far = Math.hypot(e.clientX - pending.e.clientX, e.clientY - pending.e.clientY) > MOVE;
    if (!far) return;
    // A finger that moves before the hold is a scroll; a mouse that moves is a drag.
    if (e.pointerType === 'touch') { clearTimeout(pending.timer); pending = null; return; }
    const p = pending;
    pending = null;
    begin(p.el, e.clientX, e.clientY);
  });

  window.addEventListener('pointerup', () => end(true));
  window.addEventListener('pointercancel', () => end(false));
  // While a finger drags, the page must not scroll under it (the edge scrolling does that).
  window.addEventListener('touchmove', e => { if (drag) e.preventDefault(); }, { passive: false });
  // A long press would otherwise open the browser's menu.
  root.addEventListener('contextmenu', e => { if (drag || pending) e.preventDefault(); });
}
