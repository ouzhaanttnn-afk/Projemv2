// Styles are "skeletons": meter, tempo range, swing range and drum patterns
// that already sound musical. The text chooses among them and fills them in;
// letters never place drum hits at random.

export interface Style {
  id: string;
  name: string; // shown to people, Turkish
  stepsPerBar: number; // 16th-note steps
  stepsPerBeat: number; // the pulse people count
  /** step indexes where accent groups start (e.g. 9/8 = 2+2+2+3) */
  groups: number[];
  /** beats per minute of the counted pulse */
  tempo: [number, number];
  swing: [number, number]; // 0.5 = straight
  kicks: number[][];
  snares: number[][];
  /** hats per bar options (Euclidean density) */
  hatDensity: number[];
  /** preferred scale ids with weights */
  scales: Partial<Record<ScaleId, number>>;
  /** kit preference per role: weight multipliers for variants 0..5 */
  kitBias?: Partial<Record<number, number[]>>;
  /** whether the style swings odd 16ths (duple meters only) */
  duple: boolean;
}

export type ScaleId =
  | "nihavend"
  | "kurdi"
  | "hicaz"
  | "ussak"
  | "dorian"
  | "major"
  | "mixolydian"
  | "pentaMinor";

export const SCALES: Record<ScaleId, { name: string; steps: number[] }> = {
  nihavend: { name: "Nihavend (hüzünlü)", steps: [0, 2, 3, 5, 7, 8, 10] },
  kurdi: { name: "Kürdi (karanlık)", steps: [0, 1, 3, 5, 7, 8, 10] },
  hicaz: { name: "Hicaz (doğulu)", steps: [0, 1, 4, 5, 7, 8, 10] },
  ussak: { name: "Uşşak tadı (çeyrek ses)", steps: [0, 1.5, 3, 5, 7, 8, 10] },
  dorian: { name: "Dorian (serin)", steps: [0, 2, 3, 5, 7, 9, 10] },
  major: { name: "Majör (neşeli)", steps: [0, 2, 4, 5, 7, 9, 11] },
  mixolydian: { name: "Miksolidyen (güneşli)", steps: [0, 2, 4, 5, 7, 9, 10] },
  pentaMinor: { name: "Pentatonik (sade)", steps: [0, 3, 5, 7, 10] },
};

export const SCALE_IDS = Object.keys(SCALES) as ScaleId[];

// Roles
export const KICK = 0;
export const SNARE = 1;
export const HAT = 2;
export const BASS = 3;
export const MELODY = 4;
export const SPICE = 5;
export const ROLE_NAMES = ["Kalın vuruş", "Tok vuruş", "Tıkırtı", "Bas", "Melodi", "Baharat"];

export const STYLES: Style[] = [
  {
    id: "boombap",
    name: "Boom-bap",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [84, 98],
    swing: [0.54, 0.62],
    kicks: [
      [0, 10],
      [0, 7, 10],
      [0, 3, 10, 11],
    ],
    snares: [[4, 12], [4, 12, 15]],
    hatDensity: [8, 6],
    scales: { nihavend: 2, dorian: 2, pentaMinor: 2, kurdi: 1 },
    kitBias: { 0: [1, 2, 1, 0.5, 2, 0.5], 1: [1, 2, 1, 1, 0.5, 2] },
    duple: true,
  },
  {
    id: "trap",
    name: "Trap",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [132, 152],
    swing: [0.5, 0.52],
    kicks: [
      [0, 7, 11],
      [0, 3, 6, 11],
      [0, 10, 11],
    ],
    snares: [[8], [8, 15]],
    hatDensity: [8, 12, 16],
    scales: { nihavend: 2, kurdi: 2, hicaz: 1, pentaMinor: 1 },
    kitBias: { 0: [3, 1, 0.5, 2, 0.5, 0.5], 3: [3, 0.5, 1, 1, 0.5, 0.5] },
    duple: true,
  },
  {
    id: "house",
    name: "House",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [118, 128],
    swing: [0.5, 0.56],
    kicks: [[0, 4, 8, 12]],
    snares: [[4, 12]],
    hatDensity: [4, 8],
    scales: { dorian: 2, major: 1, mixolydian: 1, nihavend: 1 },
    kitBias: { 0: [0.5, 3, 1, 1, 1, 0.5], 1: [3, 1, 1, 1, 0.5, 0.5] },
    duple: true,
  },
  {
    id: "lofi",
    name: "Lo-fi",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [70, 84],
    swing: [0.57, 0.64],
    kicks: [
      [0, 9],
      [0, 7, 9],
    ],
    snares: [[4, 12]],
    hatDensity: [8, 5],
    scales: { dorian: 2, major: 2, mixolydian: 1, pentaMinor: 1 },
    kitBias: { 0: [0.5, 1, 1, 0.3, 3, 0.5], 1: [0.5, 1, 1, 1, 1, 3] },
    duple: true,
  },
  {
    id: "dembow",
    name: "Dembow",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [92, 102],
    swing: [0.5, 0.52],
    kicks: [[0, 4, 8, 12]],
    snares: [[3, 6, 11, 14]],
    hatDensity: [8, 4],
    scales: { nihavend: 2, kurdi: 1, hicaz: 1, mixolydian: 1 },
    duple: true,
  },
  {
    id: "dnb",
    name: "Drum & bass",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [164, 176],
    swing: [0.5, 0.53],
    kicks: [
      [0, 10],
      [0, 6, 10],
    ],
    snares: [[4, 12], [4, 12, 14]],
    hatDensity: [8, 12],
    scales: { nihavend: 2, kurdi: 1, dorian: 1 },
    kitBias: { 0: [0.5, 3, 2, 1, 0.5, 0.5], 1: [1, 3, 1, 2, 0.5, 0.5] },
    duple: true,
  },
  {
    id: "afro",
    name: "Afro",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [100, 112],
    swing: [0.53, 0.58],
    kicks: [
      [0, 6, 12],
      [0, 6, 10, 12],
    ],
    snares: [[4, 12], [3, 7, 12]],
    hatDensity: [7, 9],
    scales: { major: 2, mixolydian: 2, pentaMinor: 1, dorian: 1 },
    kitBias: { 2: [1, 2, 1, 0.5, 3, 1] },
    duple: true,
  },
  {
    id: "halay",
    name: "Halay",
    stepsPerBar: 16,
    stepsPerBeat: 4,
    groups: [0, 4, 8, 12],
    tempo: [100, 118],
    swing: [0.5, 0.54],
    kicks: [
      [0, 6, 8],
      [0, 3, 8, 11],
    ],
    snares: [[4, 12], [4, 10, 12]],
    hatDensity: [4, 8],
    scales: { hicaz: 3, ussak: 2, kurdi: 1, nihavend: 1 },
    kitBias: { 0: [0.5, 1, 0.5, 1, 0.5, 4], 1: [0.5, 1, 1, 1, 3, 0.5] },
    duple: true,
  },
  {
    id: "roman",
    name: "Roman havası 9/8",
    stepsPerBar: 18,
    stepsPerBeat: 2,
    groups: [0, 4, 8, 12],
    tempo: [210, 250], // eighth notes per minute
    swing: [0.5, 0.5],
    kicks: [
      [0, 8],
      [0, 8, 14],
    ],
    snares: [[4, 12, 16], [4, 12, 14, 16]],
    hatDensity: [9, 6],
    scales: { hicaz: 3, ussak: 2, kurdi: 1 },
    kitBias: { 0: [0.5, 1, 1, 0.5, 0.5, 3], 1: [0.5, 1, 1, 1, 3, 0.5] },
    duple: false,
  },
  {
    id: "aksak7",
    name: "Aksak 7/8",
    stepsPerBar: 14,
    stepsPerBeat: 2,
    groups: [0, 4, 8],
    tempo: [200, 240],
    swing: [0.5, 0.5],
    kicks: [
      [0, 8],
      [0, 4, 8],
    ],
    snares: [[4, 12], [8, 12]],
    hatDensity: [7, 5],
    scales: { hicaz: 2, ussak: 2, nihavend: 1, kurdi: 1 },
    duple: false,
  },
  {
    id: "aksak5",
    name: "Türk aksağı 5/8",
    stepsPerBar: 10,
    stepsPerBeat: 2,
    groups: [0, 4],
    tempo: [190, 230],
    swing: [0.5, 0.5],
    kicks: [[0], [0, 6]],
    snares: [[4], [4, 8]],
    hatDensity: [5, 3],
    scales: { hicaz: 2, kurdi: 1, nihavend: 1, ussak: 1 },
    duple: false,
  },
  {
    id: "altisekiz",
    name: "6/8 sallantı",
    stepsPerBar: 12,
    stepsPerBeat: 6,
    groups: [0, 6],
    tempo: [52, 64], // dotted quarters per minute
    swing: [0.5, 0.5],
    kicks: [
      [0, 9],
      [0, 7],
    ],
    snares: [[6], [6, 10]],
    hatDensity: [6, 4],
    scales: { nihavend: 2, major: 1, hicaz: 1, dorian: 1 },
    duple: false,
  },
];
