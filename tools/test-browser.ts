// Aynı yazı tarayıcıda da bit bit aynı sesi veriyor mu? (Chromium)
// iPhone'daki Safari burada denenemiyor; dinleme sayfası aynı kontrolü
// telefonda kendisi yapıp sonucu gösteriyor.
import { createRequire } from "node:module";
import { bundleEngine } from "./bundle.ts";
import { makeBeat, pcmChecksum } from "../src/engine/index.ts";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
export const DEVICE_TEXTS = ["sjsjsj", "sjsjsjŞ", "gkdncomdşcmr dpftpcşdpvkrnvşdmfofnclsxkjrıf", "HAHAHAHA", "aşkdjfaşlkdj", "😂 ğüşiöçı"];

const expected = DEVICE_TEXTS.map((t) => pcmChecksum(makeBeat(t)!.pcm));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<script>${bundleEngine()}</script>`);
const got: string[] = await page.evaluate((texts: string[]) => {
  const RB = (window as any).RB;
  return texts.map((t) => RB.pcmChecksum(RB.makeBeat(t).pcm));
}, DEVICE_TEXTS);
await browser.close();
let ok = true;
DEVICE_TEXTS.forEach((t, i) => {
  const same = got[i] === expected[i];
  ok &&= same;
  console.log(`${same ? "✓" : "✗"} ${JSON.stringify(t)}  node ${expected[i]}  chromium ${got[i]}`);
});
console.log(ok ? "\nNode ve Chromium bit bit aynı sesi üretiyor" : "\nFARK VAR");
process.exit(ok ? 0 : 1);
