// Blending two laughs (PLAN.md 4.5).
//
// Six bars: the first laugh alone (2), the reply alone (2), both together (2).
// The reply is re-composed in the first laugh's style, tempo and key so they
// fit, but keeps its own sounds and motif. Together, the roles are split so
// both stay recognisable on a mono phone speaker: the first laugh keeps the
// kick, bass and melody; the reply brings snare, ticks, spice and its melody
// one octave higher.

import { TPS, compose, type ComposeOptions, type NoteEvent, type Score } from "./compose.ts";
import { BASS, HAT, KICK, MELODY, SNARE, SPICE } from "./styles.ts";

const FIRST_ROLES = new Set([KICK, BASS, MELODY]);
const REPLY_ROLES = new Set([SNARE, HAT, SPICE, MELODY]);

export function duet(first: string, reply: string, opts: ComposeOptions = {}): Score | null {
  const a = compose(first, opts);
  if (!a) return null;
  const b = compose(reply, { force: { styleId: a.styleId, bpm: a.bpm, root: a.root, scaleId: a.scaleId } });
  if (!b) return null;
  const bar = a.stepsPerBar * TPS;
  const events: NoteEvent[] = [];
  const within = (e: NoteEvent, from: number, to: number) => e.tick >= from * bar && e.tick < to * bar;
  const shift = (e: NoteEvent, bars: number, extra: Partial<NoteEvent> = {}) => ({ ...e, tick: e.tick + bars * bar, ...extra });

  // 1-2: first laugh alone
  for (const e of a.events) if (within(e, 0, 2)) events.push({ ...e });
  // 3-4: the reply alone
  for (const e of b.events) if (within(e, 0, 2)) events.push(shift(e, 2));
  // 5-6: together, roles split
  for (const e of a.events) if (within(e, 2, 4) && FIRST_ROLES.has(e.role)) events.push(shift(e, 2));
  for (const e of b.events)
    if (within(e, 2, 4) && REPLY_ROLES.has(e.role))
      events.push(shift(e, 2, e.role === MELODY ? { midi: e.midi + 12, vel: e.vel * 0.85 } : {}));

  events.sort((x, y) => x.tick - y.tick || x.role - y.role || x.midi - y.midi);
  return {
    ...a,
    text: `${a.text} + ${b.text}`,
    identityKey: `${a.identityKey} + ${b.identityKey}`,
    bars: 6,
    events,
    segments: [
      { raw: a.text, startBar: 0, bars: 2 },
      { raw: b.text, startBar: 2, bars: 2 },
      { raw: "ikisi birlikte", startBar: 4, bars: 2 },
    ],
  };
}
