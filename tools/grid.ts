// Prints a text grid of a beat: one row per role, one column per 16th step.
import { compose, TPS, ROLE_NAMES, describe } from "../src/engine/index.ts";

export function grid(text: string, bars = 2): string {
  const s = compose(text);
  if (!s) return "(boş)";
  const steps = s.stepsPerBar * bars;
  const rows = ROLE_NAMES.map((n) => n.padEnd(12) + " ");
  const cells = ROLE_NAMES.map(() => Array(steps).fill("·"));
  for (const e of s.events) {
    const st = Math.floor(e.tick / TPS);
    if (st >= steps) continue;
    const c = cells[e.role][st];
    const mark = e.vel >= 0.95 ? "X" : e.vel >= 0.6 ? "x" : "o";
    cells[e.role][st] = c === "·" ? mark : c === mark ? "#" : "#";
  }
  const out = [`${JSON.stringify(text)} → ${describe(s).line}`];
  for (let r = 0; r < 6; r++) {
    let line = rows[r];
    for (let i = 0; i < steps; i++) line += (i % s.stepsPerBar === 0 ? "|" : "") + cells[r][i];
    out.push(line);
  }
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const t of process.argv.slice(2)) console.log(grid(t, Number(process.env.BARS ?? 2)) + "\n");
}
