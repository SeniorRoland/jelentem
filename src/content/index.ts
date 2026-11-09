import type { Balance, CareerContent, EventsContent, Face, Content, Ending, EndingKey, Interpretation, Notes, Observation, Resident, ResidentId, RecruitContent, Week } from '../engine/types';
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
import events from './events.json';
import house from './house.json';
import faces from './faces.json';
import balanceJson from './balance.json';

export const content: Content = {
  weeks: weeks as Week[],
  obs: obs as Observation[],
  ints: ints as Interpretation[],
  residents: residents as unknown as Record<ResidentId, Resident>,
  endings: endings as Record<EndingKey, Ending>,
  notes: notes as Notes,
  codenames,
  recruit: recruit as unknown as RecruitContent,
  loading,
  career: career as CareerContent,
  tasks,
  captain,
  events: events as EventsContent,
  house: house as Content['house'],
  faces: faces as Face[],
};

export const balance: Balance = balanceJson as unknown as Balance;
