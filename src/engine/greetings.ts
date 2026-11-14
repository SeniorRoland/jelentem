import { residentStatus } from './career';
import { isBonded } from './events';
import type { Content, GameState, Mood, ResidentId } from './types';

/**
 * A line on the weekly sheet about meeting a resident on the stairs: no numbers, only how they
 * look at the player. Each week a different resident, in turn; the line follows what the reports
 * have done to them and whether they trusted the player. Pure.
 */

const STORY: ResidentId[] = ['mari', 'jozsi', 'pityu'];

/** How a resident feels about the player, the strongest reason first. */
export function moodOf(s: GameState, who: ResidentId): Mood {
  if (s.betrayed.includes(who)) return 'betrayed';
  const st = residentStatus(s, who);
  if (st === 'bajban') return 'bajban';
  if (isBonded(s, who)) return 'bonded';
  return st === 'gyanus' ? 'gyanus' : 'nyugodt';
}

/** This week's encounter on the stairs, or null in the first week (nobody knows you yet). */
export function greetingFor(s: GameState, c: Content): { who: ResidentId; mood: Mood; text: string } | null {
  if (s.week < 1) return null;
  const who = STORY[s.week % STORY.length];
  const mood = moodOf(s, who);
  const lines = c.greetings.lines[who][mood];
  return { who, mood, text: lines[Math.floor(s.week / STORY.length) % lines.length] };
}
