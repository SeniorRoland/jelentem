import type { Balance, Content, Ending, EndingKey, Interpretation, Notes, Resident, ResidentId, Week } from '../engine/types';
import weeks from './weeks.json';
import ints from './interpretations.json';
import residents from './residents.json';
import endings from './endings.json';
import notes from './notes.json';
import codenames from './codenames.json';
import balanceJson from './balance.json';

export const content: Content = {
  weeks: weeks as Week[],
  ints: ints as Interpretation[],
  residents: residents as Record<ResidentId, Resident>,
  endings: endings as Record<EndingKey, Ending>,
  notes: notes as Notes,
  codenames,
};

export const balance: Balance = balanceJson as Balance;
