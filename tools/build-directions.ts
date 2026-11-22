// Builds web/yonler.html: three interface directions as playable phone prototypes.
import { readFileSync, writeFileSync } from "node:fs";
import { bundleEngine } from "./bundle.ts";
const root = new URL("..", import.meta.url);
const html = readFileSync(new URL("web/yonler.template.html", root), "utf8").replace(
  "/*__ENGINE__*/",
  () => bundleEngine().replace(/<\/script/gi, "<\\/script"),
);
writeFileSync(new URL("web/yonler.html", root), html);
console.log(`web/yonler.html (${(html.length / 1024).toFixed(0)} KB)`);
