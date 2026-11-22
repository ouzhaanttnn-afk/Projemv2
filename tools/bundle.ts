// Packs the engine into one browser script (global "RB").
import { buildSync } from "esbuild";
export function bundleEngine(): string {
  const r = buildSync({
    entryPoints: [new URL("../src/engine/index.ts", import.meta.url).pathname],
    bundle: true,
    format: "iife",
    globalName: "RB",
    minify: true,
    target: "es2020",
    write: false,
  });
  return r.outputFiles[0].text;
}
