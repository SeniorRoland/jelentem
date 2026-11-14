export type ResidentId = 'mari' | 'jozsi' | 'pityu' | 'porgoly';
/**
 * `divert` cards are only dealt while a task is open: they answer the task by blaming something harmless.
 * `alibi` cards are only dealt while a resident is close to the player (`GameState.bonds`).
 */
export type Tier = 'safe' | 'mid' | 'wild' | 'divert' | 'alibi';
export type DealTier = Exclude<Tier, 'divert' | 'alibi'>;
/** What a new captain likes: lively reports (`wild`) or dry, official ones (`dry`). */
export type Taste = 'wild' | 'dry';
/** Extra excitement per sentence by its interpretation's tier; `plain` is a bare fact without one. */
export type TasteTable = Partial<Record<Tier | 'plain', number>>;

/** The handler is replaced during the year (`state.ts` → `startWeek`), drawn at the start of the game. */
export interface Handover {
  /** From this quarter on (its first played week) the new captain is in charge. */
  quarter: number;
  taste: Taste;
  captain: ResidentName;
  /** The week the new captain took over; null until it happens. */
  week: number | null;
}
export type EndingKey = 'best' | 'kivalo' | 'megfigyelt' | 'behivatas' | 'kizarva';
export type Screen = 'intro' | 'week' | 'response' | 'quarter' | 'ending';
/** How the reports have treated a resident so far. */
export type ResidentStatus = 'nyugodt' | 'gyanus' | 'bajban';
/** Quarterly grade from the captain. */
export type Grade = 'kivalo' | 'megfelelo' | 'hianyos';
export type Hint = '' | 'slotsFull' | 'needObs' | 'intsFull';
/**
 * How far the reports have gone for a resident, in order: a warning, real trouble (the story
 * turns, the resident is `bajban`), and ruin (they lose their livelihood).
 */
export type ConsLevel = 'warn' | 'trouble' | 'ruin';
export const CONS_LEVELS: readonly ConsLevel[] = ['warn', 'trouble', 'ruin'];

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
  /** Quarters (0-based) the observation may come up in; missing = any quarter. */
  quarters?: number[];
  /** Only drawn while the resident is in one of these states (key = the observation's `who`). */
  requires?: Partial<Record<ResidentId, ResidentStatus[]>>;
  /** Task topics this observation answers when reported (see `Task.topic`). */
  topics?: string[];
  /**
   * About the player („Alulírott…”). Never in a normal slot: one comes as an extra card each
   * week while the caretaker is reporting on the player (`GameState.watched`).
   */
  self?: boolean;
  /** Comes only with this house event (`HouseEvent.obs`), never in a normal slot. */
  event?: string;
}

/**
 * A week draws one observation per slot from the pool, at the week's `level`.
 * Each slot lists who the observation may be about (`null` = common area).
 */
export interface Week {
  label: string;
  intro: string;
  /** 0-based quarter; the captain grades the player at the end of each. */
  quarter: number;
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
  /** Task topics this interpretation answers. Every `divert` card has exactly one. */
  topics?: string[];
  /** An `alibi` card covers this resident only; on anyone else it costs credibility. */
  who?: ResidentId;
}

/**
 * Something that happens in the house in a week. A `kind` event is a resident being kind to
 * the player: they become close (`GameState.bonds`) and tell something in confidence.
 * A `house` event changes what the captain expects that week. Both may bring observations.
 */
export interface HouseEvent {
  id: string;
  kind: 'kind' | 'house';
  /** The resident who is kind (kind events only). */
  who?: ResidentId;
  quarters?: number[];
  requires?: Partial<Record<ResidentId, ResidentStatus[]>>;
  title: string;
  text: string;
  /** Added to the week's expectation. */
  expect?: number;
  /** Observation ids that come with the event (each has `event` set to this id). */
  obs?: string[];
}

/** House events and the texts around the residents' trust. */
export interface EventsContent {
  labels: {
    title: string;
    bond: string;
    confidential: string;
    alibi: string;
    misuse: string;
    bonded: string;
    betrayed: string;
  };
  /** What happens when the player harms a close resident, and how it ends if they never do. */
  betrayed: Partial<Record<ResidentId, string>>;
  kept: Partial<Record<ResidentId, string>>;
  list: HouseEvent[];
}

/** A family name candidate for a resident, with the true trait it comes from. */
export interface ResidentName {
  name: string;
  why: string;
}

/**
 * A given-name candidate: `n` the name, `b` what the house calls them („Mari néni”), and any
 * inflected forms the texts need (`nal`: „Máriánál”, `t`: „Istvánt”). Texts use `{mari.n}` etc.
 */
export type GivenName = { n: string; b: string } & Record<string, string>;

/** A portrait from `src/assets/faces/<id>.jpg`. */
export interface Face {
  id: string;
  sex: Sex;
  age: number;
}

/** Who a resident is in this game: given name, age (from the portrait) and portrait id. */
export interface Person {
  given: GivenName;
  age: number;
  face: string;
}

export interface Resident {
  /** Contains the `{id}` placeholder for the generated family name and `{id.n}`-style given-name placeholders. */
  name: string;
  /** Family name candidates; one is drawn per game, never shared with another person. */
  surnames: ResidentName[];
  /** Given-name candidates (the first is the original); every one has the same forms. */
  given: GivenName[];
  sex: Sex;
  /** Inclusive age range in 1979; the portrait is drawn from it. */
  age: [number, number];
  /** One line on the residents' list. */
  role: string;
  /** What happens to them at each step; residents without it never face consequences. */
  cons?: Record<ConsLevel, string>;
  truth?: string;
  /** Where the resident's story ends, depending on whether the reports got them in trouble. */
  fate?: { ok: string; bajban: string; ruin: string };
}

/** A detail of the desk photo clipped to a sheet (`src/assets/details/<id>.jpg`), with a typed caption. */
export interface Photo {
  id: string;
  caption: string;
}

export interface Ending {
  title: string;
  text: string;
  photo?: Photo;
}

export interface Notes {
  empty: string;
  low: string;
  ok: string;
  good: string;
  great: string;
  fantasy: string;
  /** The captain's remark under a report with typing errors, one picked per week. */
  typo: string[];
  /** Fires when an observation is reported whose `tag` was already reported before. */
  repeat: { tag: string; note: string }[];
  /** How far it went for a resident, as the quarterly review and the ending put it. */
  cons: Record<ConsLevel, string>;
  /** The caretaker's counter-reports on the player. */
  watch: {
    label: string;
    weekHint: string;
    started: string;
    hidden: string;
    honest: string;
    calmed: string;
    still: string;
    epilogueNone: string;
    epilogueSome: string;
  };
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
  /** The captain's line about this category in the opening letter. */
  letter: string;
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

/** A quarterly order from the captain: report something on `topic` before the quarter ends. */
export interface Task {
  id: string;
  topic: string;
  title: string;
  done: string;
  fail: string;
}

/** Rank names and the captain's quarterly texts. Numbers live in `Balance`. */
export interface CareerContent {
  quarters: string[];
  ranks: { label: string; promo: string; demo: string; reward?: string; photo?: Photo }[];
  grades: Record<Grade, { title: string; note: string }>;
  stay: string;
  /** What a promotion brings (`ranks[i].reward`), and the exclusion from the network. */
  rewardTitle: string;
  excluded: { label: string; text: string; button: string };
  /** Labels around the quarterly task. */
  task: { title: string; open: string; done: string; now: string; divert: string };
}

/** The black opening screen: the title as a quote, and who said it. Quote marks are added by the UI. */
export interface TitleCard {
  quote: string;
  source: string;
  skip: string;
}

/** Texts of the satirical loading screen shown before the game. */
export interface LoadingContent {
  office: string;
  title: string;
  lede: string;
  steps: string[];
  /** Mishaps that push the progress back once per load. */
  setbacks: string[];
  done: string;
  setbackDone: string;
  overfulfil: string;
  stamp: string;
  skip: string;
  enter: string;
  /** The title card shown before the loading screen. */
  card: TitleCard;
  /** What the game is and is not: satire of the system, never making light of what people went through. */
  /** `privacy`: how the site counts visits, shown only behind the „!”, not on the first screen. */
  notice: { title: string; text: string[]; ack: string; button: string; privacy: string };
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
  loading: LoadingContent;
  career: CareerContent;
  tasks: Task[];
  /** The handler: family name candidates, each hinting at what he does. Texts use `{szazados}`. */
  captain: {
    surnames: ResidentName[];
    /** The handover scene and the new captain's taste, as the house hears of it. */
    handover: { title: string; lines: string[]; tastes: Record<Taste, string>; photo: string };
  };
  /** The address (`{cim}`): street names and the house number range; the young resident's girl (`{lany}`). */
  house: { streets: string[]; numbers: [number, number]; girl: ResidentName[] };
  faces: Face[];
  events: EventsContent;
  dossier: DossierContent;
  help: HelpContent;
  review: ReviewContent;
  greetings: GreetingsContent;
  requests: RequestsContent;
  medals: MedalsContent;
  stats: StatsContent;
  transitions: TransitionsContent;
  corner: CornerContent;
}

/** E = százados elégedettsége, H = hihetőség, L = lelkiismeret. All 0–100. */
export interface Meters {
  E: number;
  H: number;
  L: number;
}

export interface Balance {
  start: Meters;
  /** Base expectation per week (one entry per week of the game). */
  expect: number[];
  weight: { E: number; H: number; L: number };
  /** Sentences per report and extra expectation on each rank (index = rank). */
  ranks: { slots: number; expectBonus: number }[];
  startRank: number;
  /**
   * What the recruit's category („Milyen kategóriába tartozik”) does: extra expectation,
   * and `doubt`, the multiplier on lost credibility (a loyal recruit's exaggeration is more suspicious).
   */
  categories: Record<string, { expectBonus: number; doubt: number }>;
  /**
   * The caretaker starts reporting on the player when H falls below `hBelow` after a report,
   * and stops at a review where H is at least `calmAt`. Reporting the week's self-observation
   * adds `honest` credibility, leaving it out costs `hidden` (both before `weight.H`).
   */
  watch: { hBelow: number; calmAt: number; honest: number; hidden: number };
  /**
   * House events: from week `fromWeek` (0-based) one comes with `chance` each week. Harm to a
   * close resident costs `guilt` times the conscience; an alibi card on someone else gives
   * `-misuse` credibility.
   */
  events: { fromWeek: number; chance: number; guilt: number; misuse: number };
  /**
   * What a promotion to a rank brings (key = the new rank): meter changes, or `holiday`, a SZOT
   * stay that skips the first week of the next quarter while its other weeks expect `holiday.expect` more.
   */
  rewards: Record<string, { E?: number; H?: number; L?: number; holiday?: boolean }>;
  holiday: { expect: number };
  /**
   * The candidate resident's review: sentences in the other report, justifications a week, the share
   * of a kept sentence's excitement and harm that counts for the player, and the credibility a strike
   * costs with and without a justification (before `weight.H`).
   */
  review: { sentences: number; excuses: number; keptIzg: number; keptHarm: number; excused: number; unexcused: number };
  /** Typing errors: chance per sentence `base + nervous × (1 − L/100)`, each costs `penalty` satisfaction. */
  typos: { base: number; nervous: number; penalty: number };
  /** The handler's replacement: with `chance`, from `quarter`, with one of the `tastes`. */
  handover: { chance: number; quarter: number; tastes: Record<Taste, TasteTable> };
  /** Residents' favours: from `fromWeek`, `chance` a week, at most `max`; yes is found out with `risk`. */
  requests: { fromWeek: number; chance: number; max: number; risk: number; found: { E: number; H: number }; refuse: number };
  /** Hiányos quarters in a row on the passive rank that get the player excluded from the network. */
  exclusion: { streak: number };
  /** Tasks start in this quarter; done = E bonus, not done = E penalty at the review. */
  task: { fromQuarter: number; reward: number; penalty: number };
  quarter: {
    /** Grade „kiváló” at or above these, „hiányos” below demoteE. */
    promoteE: number;
    promoteH: number;
    demoteE: number;
    /** E moves this far back towards start.E between quarters (0 = keep, 1 = reset). */
    resetE: number;
    /** The conscience and the credibility recover this much between quarters. */
    healL: number;
    healH: number;
  };
  deal: Record<DealTier, number>;
  /** Harm gathered on one resident (over the whole year) that brings each step. */
  consequences: Record<ConsLevel, number>;
  plainFact: { hih: number; mult: number };
  absurd: { minIntIzg: number; maxObsIzg: number; penalty: number };
  overall: { lowBelow: number; goodAbove: number; greatAbove: number; fantasyHihAtMost: number };
  endings: { hMin: number; eMin: number; lMin: number };
}

export interface Slot {
  o: string | null;
  i: string | null;
  /** When its observation was put in (larger is later): a tapped interpretation goes to the latest one. */
  t?: number;
}

/** A misspelt word in a reported sentence: where it starts in `text`, the right word and the typed one. */
export interface Typo {
  at: number;
  from: string;
  to: string;
}

/** How a resident looks at the player on the stairs (`greetings.ts`). */
export type Mood = 'nyugodt' | 'gyanus' | 'bajban' | 'bonded' | 'betrayed';

/** The weekly encounter on the stairs: two or more lines per resident and mood. */
export interface GreetingsContent {
  label: string;
  lines: Record<ResidentId, Record<Mood, string[]>>;
}

export interface SentenceResult {
  text: string;
  /** A typing error the captain corrected in the margin. */
  typo?: Typo;
  note: string | null;
  izg: number;
  hih: number;
  harm: number;
  who: ResidentId | null;
  /** About the player (an „Alulírott…” observation). */
  self?: boolean;
}

/** A sentence as it went into a report, kept for the end-of-game file (placeholders unfilled). */
export interface LoggedSentence {
  week: number;
  text: string;
  note: string | null;
  izg: number;
  hih: number;
  harm: number;
}

/** Texts of the scenes between screens: the weekly calendar, the quarter's results, the opening. */
export interface TransitionsContent {
  skip: string;
  week: { weekNo: string; lines: string[] };
  quarter: { title: string; grade: string; rank: string; unchanged: string; task: string; taskDone: string; taskFail: string; house: string };
  intro: { lines: string[]; folder: string; code: string; stamp: string };
  /** The postcard of the week the SZOT stay skips. */
  holiday: { title: string; text: string };
  /** What the captain says when caught peeking in (an easter egg, src/ui/peek.ts). */
  peek: { lines: string[] };
}

/** The boxed buttons in the top left corner: sound on and off, and the new game with its question. */
export interface CornerContent {
  sound: string;
  soundOn: string;
  soundOff: string;
  restart: { button: string; title: string; text: string[]; yes: string; no: string };
}

/** The help dialog behind the boxed „H”: how the game works, without its secrets. */
export interface HelpContent {
  button: string;
  title: string;
  lede: string;
  close: string;
  sections: { title: string; text: string[] }[];
}

/** Labels of the shareable file at the end of the game. */
export interface DossierContent {
  title: string;
  lede: string;
  heading: string;
  code: string;
  rank: string;
  ending: string;
  best: string;
  captain: string;
  harmed: string;
  noneHarmed: string;
  trusted: string;
  onYou: string;
  onYouLabel: string;
  weeks: string;
  realName: string;
  footer: string;
  download: string;
  share: string;
  copy: string;
  copied: string;
  failed: string;
  file: string;
}

/** Another informant's report the candidate resident checks: sentences, which are struck, the week's justifications. */
export interface Review {
  items: { o: string; i: string }[];
  struck: boolean[];
  excuses: string[];
}

/** Texts of the reviewed report: the heading, the hint, the captain's remark, the justifications. */
export interface ReviewContent {
  title: string;
  lede: string;
  struck: string;
  kept: string;
  excuse: string;
  noExcuse: string;
  left: string;
  excuses: string[];
}

export interface WeekResult {
  sents: SentenceResult[];
  /** This week's favour, how it was answered, and whether the captain heard of it. */
  request: { id: string; yes: boolean; found: boolean } | null;
  /** How many sentences had a typing error. */
  typos: number;
  before: Meters;
  after: Meters;
  overall: string;
  extra: string;
  /** Steps this report brought, one per resident: the highest one reached. */
  steps: { who: ResidentId; level: ConsLevel }[];
  stamp: 'Átvéve' | 'Hiányos';
  /** True when this report completed the quarter's task. */
  taskDone: boolean;
  /** What the caretaker did this week: started reporting, or reported what the player left out. */
  watch: { started: boolean; hidden: string | null; honest: boolean };
  /** Close residents this report harmed: the trust is gone. */
  betrayed: ResidentId[];
  /** The reviewed report as it went on: each sentence, struck or kept, and its justification. */
  review: { peer: string; sents: { text: string; struck: boolean; excuse: string | null }[] } | null;
}

/** The open task of the quarter. */
export interface TaskState {
  id: string;
  done: boolean;
}

export interface QuarterResult {
  quarter: number;
  grade: Grade;
  /** The quarter's task and whether it was done; null when the quarter had none. */
  task: TaskState | null;
  /** The caretaker stopped reporting at this review (true), kept on (false), or was not (null). */
  calmed: boolean | null;
  /** The reward the promotion brought (the new rank), or null. */
  reward: number | null;
  /** The player was excluded from the network at this review: the game ends here. */
  excluded: boolean;
  rankBefore: number;
  rankAfter: number;
  before: Meters;
  after: Meters;
}

export interface GameState {
  screen: Screen;
  week: number;
  /** Index into `Balance.ranks` and `CareerContent.ranks`. */
  rank: number;
  lastQuarter: QuarterResult | null;
  /** The current quarter's task, and the ids of tasks already given in this game. */
  task: TaskState | null;
  pastTasks: string[];
  /** Ids of the tasks done in this game. */
  doneTasks: string[];
  /** The caretaker is reporting on the player; and how many of her reports went in. */
  watched: boolean;
  reportsOnYou: number;
  /** The house event of each week so far (index = week), null when nothing happened. */
  events: (string | null)[];
  /** Residents close to the player now, and those whose trust the reports broke. */
  bonds: ResidentId[];
  /** Residents who trust the player since a favour was done for them (no alibi card, unlike `bonds`). */
  favored: ResidentId[];
  /** This week's favour asked by a resident, and the answer so far (null: not yet). */
  request: { id: string; answer: boolean | null } | null;
  /** Every favour asked this year and how it ended. */
  asked: { id: string; yes: boolean; found: boolean }[];
  betrayed: ResidentId[];
  /** The other informant whose reports the candidate resident checks, this week's one, and the observations used for them. */
  peer: string | null;
  review: Review | null;
  peerUsed: string[];
  /** Hiányos quarters in a row on the passive rank; at `exclusion.streak` the player is excluded. */
  passiveStreak: number;
  excluded: boolean;
  /** The week skipped for a SZOT stay, and the quarter whose other weeks expect more (null: none). */
  holiday: number | null;
  holidayQuarter: number | null;
  meters: Meters;
  code: string;
  recruit: Recruit;
  /** Generated family names of the residents, filled into every `{id}` placeholder. */
  names: Record<ResidentId, ResidentName>;
  /** The handler's generated family name. */
  captain: ResidentName;
  /** The coming (or done) replacement of the handler; null if the year keeps the same captain. */
  handover: Handover | null;
  /** The first captain, once replaced. */
  prevCaptain: ResidentName | null;
  /** Given names, ages and portraits of the residents; the house address; the girl; the recruit's photo. */
  people: Record<ResidentId, Person>;
  address: string;
  girl: ResidentName;
  face: string;
  /** Observation ids drawn at the start of each week so far (index = week). */
  weekObs: string[][];
  harmBy: Record<ResidentId, number>;
  /** Residents in trouble or worse (`bajban`), and how far it went for each (0 = nothing yet, 1–3 = `CONS_LEVELS`). */
  cons: ResidentId[];
  consLevel: Partial<Record<ResidentId, number>>;
  reported: string[];
  /** Every sentence reported this game, for the file at the end. */
  log: LoggedSentence[];
  /** The meters before and after every week's report and every quarter's review, for the ending's statement. */
  history: StatRow[];
  usedInts: string[];
  slots: Slot[];
  dealt: string[];
  last: WeekResult | null;
  hint: Hint;
}

/** Random source in [0, 1). Inject a seeded one in tests and simulations. */
export type Rng = () => number;

/** One line of the year's statement: a week's report, a quarter's review, or the last week's task settled. */
export interface StatRow {
  kind: 'week' | 'quarter' | 'task';
  /** The week it happened after (index into `weeks.json`). */
  week: number;
  quarter: number;
  before: Meters;
  after: Meters;
  /** The quarter's grade, on a quarter row. */
  grade: Grade | null;
}

/** The ending's statement of the year, week by week (`stats.json`). */
export interface StatsContent {
  title: string;
  lede: string;
  cols: { when: string; E: string; H: string; L: string };
  /** Placeholders: `{n}` the week's number, `{q}` the quarter (`quarters`). */
  week: string;
  quarter: string;
  task: string;
  /** The first row: where the meters stood when the file was opened. */
  start: string;
  quarters: string[];
  summaryTitle: string;
  /** Placeholders: `{meter}`, `{best}`, `{worst}`, `{total}`. */
  summary: string;
  /** For a meter the reports never moved. Placeholder: `{meter}`. */
  still: string;
  none: string;
  empty: string;
  note: string;
}

/** A favour a resident asks (`requests.json`); `yes` and `no` are the news of how it went. */
export interface ResidentRequest {
  id: string;
  who: ResidentId;
  text: string;
  yes: string;
  no: string;
}

export interface RequestsContent {
  title: string;
  yes: string;
  no: string;
  pending: string;
  chosenYes: string;
  chosenNo: string;
  /** The captain's note when he hears of a favour done. */
  found: string;
  items: ResidentRequest[];
}

/** A medal (`medals.json`): its rule is in `medals.ts` by `id` (or given by the UI). */
export interface Medal {
  id: string;
  title: string;
  text: string;
  /** Shown while it is not earned: a vague hint, never the rule. */
  hint: string;
  /** The ribbon's stripes, left to right. */
  ribbon: string[];
}

export interface MedalsContent {
  button: string;
  title: string;
  lede: string;
  /** Placeholders: `{n}` earned, `{all}` all. */
  count: string;
  locked: string;
  endingTitle: string;
  endingNew: string;
  endingNone: string;
  close: string;
  list: Medal[];
}
