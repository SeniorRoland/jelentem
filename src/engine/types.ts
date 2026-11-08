export type ResidentId = 'mari' | 'jozsi' | 'pityu' | 'porgoly';
export type Tier = 'safe' | 'mid' | 'wild';
export type EndingKey = 'best' | 'kivalo' | 'megfigyelt' | 'behivatas';
export type Screen = 'intro' | 'week' | 'response' | 'ending';
export type Hint = '' | 'slotsFull' | 'needObs' | 'intsFull';

/**
 * One thing the player saw in the house. `izg` = excitement, `art` = harm potential.
 * `level` matches `Week.level`; observations sharing a `tag` can trigger a repeat note.
 */
export interface Observation {
  id: string;
  who: ResidentId | null;
  level: number;
  izg: number;
  art: number;
  text: string;
  note?: string;
  tag?: string;
}

/**
 * A week draws one observation per slot from the pool, at the week's `level`.
 * Each slot lists who the observation may be about (`null` = common area).
 */
export interface Week {
  label: string;
  intro: string;
  level: number;
  slots: (ResidentId | null)[][];
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

/** A family name candidate for a resident, with the true trait it comes from. */
export interface ResidentName {
  name: string;
  why: string;
}

export interface Resident {
  /** Contains the `{id}` placeholder for the generated family name. */
  name: string;
  /** Family name candidates; one is drawn per game, never shared with another person. */
  surnames: ResidentName[];
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
  /** Fires when an observation is reported whose `tag` was already reported before. */
  repeat: { tag: string; note: string }[];
}

export type Sex = 'm' | 'f';

export interface Occupation {
  id: string;
  job: string;
  workplace: string[];
  school: string[];
}

/** „Milyen kategóriába tartozik”. `loyal` decides which classifications and bases fit. */
export interface RecruitCategory {
  id: string;
  label: string;
  loyal: boolean;
  /** Inclusive birth-year range that makes sense for this category. */
  born: [number, number];
  sex?: Sex;
  /** Occupation ids; when missing, any occupation fits. */
  jobs?: string[];
}

/** A hálózati személy osztályozása. `bases` are ids from `RecruitContent.bases`. */
export interface RecruitClass {
  id: string;
  label: string;
  loyal: boolean;
  bases: string[];
}

/**
 * A family name that fits a trait of the person (nomen est omen). Every condition given
 * must hold; an entry normally has exactly one. `why` says which trait it comes from.
 */
export interface Surname {
  name: string;
  why: string;
  jobs?: string[];
  categories?: string[];
  schools?: string[];
  bornMin?: number;
  bornMax?: number;
}

/** A fictional place; `from` is the family name made from it („Iratosd” → „Iratosdi”). */
export interface Place {
  name: string;
  from: string;
}

export interface RecruitContent {
  surnames: Surname[];
  givenNames: Record<Sex, string[]>;
  places: Place[];
  months: string[];
  occupations: Occupation[];
  categories: RecruitCategory[];
  /** Classification scheme before 1972, and the new one from 1972. */
  classes: { before1972: RecruitClass[]; from1972: RecruitClass[] };
  /** `text` stands alone on the card, `short` is used inside a combination. */
  bases: Record<string, { text: string; short: string }>;
  /** Label used when the recruitment had several bases at once. */
  combo: string;
  /** „gyors” or „fokozatos bevonással”. */
  methods: string[];
  /** Chance that a non-loyal recruit has a combination of bases. */
  comboChance: number;
}

/** The player's recruitment card. Generated once per game. */
export interface Recruit {
  serial: string;
  name: string;
  /** The trait the family name comes from. */
  nameWhy: string;
  sex: Sex;
  birthYear: number;
  birthPlace: string;
  mother: string;
  jobId: string;
  job: string;
  workplace: string;
  school: string;
  /** Category id; later it may change what the captain expects. */
  categoryId: string;
  category: string;
  /** ISO date, 1971 or 1972. */
  recruitedOn: string;
  classId: string;
  classLabel: string;
  basis: string;
}

export interface Content {
  weeks: Week[];
  obs: Observation[];
  ints: Interpretation[];
  residents: Record<ResidentId, Resident>;
  endings: Record<EndingKey, Ending>;
  notes: Notes;
  codenames: { adj: string[]; noun: string[] };
  recruit: RecruitContent;
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
  recruit: Recruit;
  /** Generated family names of the residents, filled into every `{id}` placeholder. */
  names: Record<ResidentId, ResidentName>;
  /** Observation ids drawn for every week at the start of the game. */
  weekObs: string[][];
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
