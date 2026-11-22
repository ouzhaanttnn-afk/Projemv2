// Plain Turkish description of a beat, for people (not for code).

import { ROOT_NAMES, type Score } from "./compose.ts";
import { SCALES } from "./styles.ts";
import { VARIANT_NAMES } from "./synth.ts";

export interface Description {
  style: string;
  tempo: string;
  key: string;
  kit: string[];
  line: string;
}

export function describe(s: Score): Description {
  const tempo = `${Math.round(s.bpm)} tempo`;
  const key = `${ROOT_NAMES[s.root]} ${SCALES[s.scaleId].name}`;
  const kit = s.kit.map((v, role) => VARIANT_NAMES[role][v]);
  return {
    style: s.styleName,
    tempo,
    key,
    kit,
    line: `${s.styleName} · ${tempo} · ${key}`,
  };
}
