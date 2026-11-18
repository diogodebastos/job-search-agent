#!/usr/bin/env node
/* Download the Latin woff2 of open-licence Google Fonts families.
 *   node scripts/fetch-fonts.mjs <out-dir> "<css2 query>"
 *   node scripts/fetch-fonts.mjs <application>/brand/fonts "family=Oswald:wght@200..700&family=Mona+Sans:wdth,wght@75..125,200..900"
 * Writes <Family>.woff2 per family (variable fonts keep their axes). Sends no
 * personal data: a generic browser User-Agent is needed to be served woff2. */
import fs from "fs";
import path from "path";
const [out, query] = process.argv.slice(2);
if (!out || !query) { console.error('usage: fetch-fonts.mjs <out-dir> "family=...&family=..."'); process.exit(2); }
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}&display=block`, { headers: { "User-Agent": UA } })).text();
fs.mkdirSync(out, { recursive: true });
const seen = new Set();
for (const m of css.matchAll(/\/\* latin \*\/\s*@font-face\s*{([^}]*)}/g)) {
  const family = m[1].match(/font-family:\s*'([^']+)'/)?.[1], url = m[1].match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  const style = /font-style:\s*italic/.test(m[1]) ? "-Italic" : "";
  const name = family?.replaceAll(" ", "") + style;
  if (!family || !url || seen.has(name)) continue;
  seen.add(name);
  fs.writeFileSync(path.join(out, `${name}.woff2`), Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log(`${family}${style} -> ${path.join(out, name + ".woff2")}`);
}
if (!seen.size) { console.error("no Latin woff2 found; check the family names (is the font on Google Fonts?)"); process.exit(1); }
