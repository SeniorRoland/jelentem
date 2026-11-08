import type { Balance, CareerContent, Content, Ending, EndingKey, Interpretation, Notes, Observation, Resident, ResidentId, RecruitContent, Week } from '../engine/types';
import weeks from './weeks.json';
import obs from './observations.json';
import ints from './interpretations.json';
import residents from './residents.json';
import endings from './endings.json';
import notes from './notes.json';
import codenames from './codenames.json';
import recruit from './recruit.json';
import loading from './loading.json';
import career from './career.json';
import tasks from './tasks.json';
import captain from './captain.json';
import balanceJson from './balance.json';

export const content: Content = {
  weeks: weeks as Week[],
  obs: obs as Observation[],
  ints: ints as Interpretation[],
  residents: residents as Record<ResidentId, Resident>,
  endings: endings as Record<EndingKey, Ending>,
  notes: notes as Notes,
  codenames,
  recruit: recruit as unknown as RecruitContent,
  loading,
  career: career as CareerContent,
  tasks,
  captain,
};

export const balance: Balance = balanceJson as unknown as Balance;
