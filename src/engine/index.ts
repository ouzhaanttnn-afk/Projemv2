export { compose, tickToSeconds, scoreDuration, TPS, BARS, ROOT_NAMES, TEMPO_MIN, TEMPO_MAX, type Score, type NoteEvent, type ComposeOptions } from "./compose.ts";
export { duet } from "./duet.ts";
export { makeBeat, makeDuet, renderScore, toPCM16, encodeWav, pcmChecksum, type Beat } from "./render.ts";
export { SAMPLE_RATE, VARIANT_NAMES } from "./synth.ts";
export { STYLES, SCALES, ROLE_NAMES } from "./styles.ts";
export { analyse } from "./text.ts";
export { describe } from "./describe.ts";
