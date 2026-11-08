export type ResidentId = 'mari' | 'jozsi' | 'pityu' | 'porgoly';
export type Tier = 'safe' | 'mid' | 'wild';
export type EndingKey = 'best' | 'kivalo' | 'megfigyelt' | 'behivatas';
export type Screen = 'intro' | 'week' | 'response' | 'ending';
export type Hint = '' | 'slotsFull' | 'needObs' | 'intsFull';

/** One thing the player saw in the house this week. `izg` = excitement, `art` = harm potential. */
export interface Observation {
  id: string;
  who: ResidentId | null;
  izg: number;
  art: number;
  text: string;
  note?: string;
}

export interface Week {
  label: string;
  intro: string;
  obs: Observation[];
}

/** A bureaucratic spin appended to an observation. `hih` = credibility change, `mult` = harm multiplier. */
export interface Interpretation {
  id: string;
  tier: Tier;
  izg: number;
  hih: number;
  mult: number;
  text: string;
  note?: string;
}

export interface Resident {
  name: string;
  cons?: string;
  truth?: string;
}

export interface Ending {
  title: string;
  text: string;
}

export interface Notes {
  empty: string;
  low: string;
  ok: string;
  good: string;
  great: string;
  fantasy: string;
  repeat: { obs: string; ifReported: string; note: string }[];
}

export interface Content {
  weeks: Week[];
  ints: Interpretation[];
  residents: Record<ResidentId, Resident>;
  endings: Record<EndingKey, Ending>;
  notes: Notes;
  codenames: { adj: string[]; noun: string[] };
}

/** E = százados elégedettsége, H = hihetőség, L = lelkiismeret. All 0–100. */
export interface Meters {
  E: number;
  H: number;
  L: number;
}

export interface Balance {
  start: Meters;
  expect: number[];
  weight: { E: number; H: number; L: number };
  slotsPerWeek: number;
  deal: Record<Tier, number>;
  consThreshold: number;
  plainFact: { hih: number; mult: number };
  absurd: { minIntIzg: number; maxObsIzg: number; penalty: number };
  overall: { lowBelow: number; goodAbove: number; greatAbove: number; fantasyHihAtMost: number };
  endings: { hMin: number; eMin: number; lMin: number };
}

export interface Slot {
  o: string | null;
  i: string | null;
}

export interface SentenceResult {
  text: string;
  note: string | null;
  izg: number;
  hih: number;
  harm: number;
  who: ResidentId | null;
}

export interface WeekResult {
  sents: SentenceResult[];
  before: Meters;
  after: Meters;
  overall: string;
  extra: string;
  newCons: ResidentId[];
  stamp: 'Átvéve' | 'Hiányos';
}

export interface GameState {
  screen: Screen;
  week: number;
  meters: Meters;
  code: string;
  harmBy: Record<ResidentId, number>;
  cons: ResidentId[];
  reported: string[];
  usedInts: string[];
  slots: Slot[];
  dealt: string[];
  last: WeekResult | null;
  hint: Hint;
}

/** Random source in [0, 1). Inject a seeded one in tests and simulations. */
export type Rng = () => number;
